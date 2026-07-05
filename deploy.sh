#!/bin/bash
# ==============================================
#  考研能量站 — 云服务器一键部署脚本
#  适用于: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
#  用法:   bash deploy.sh
# ==============================================
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════╗"
echo "  ║   考研能量站 · 云服务器部署       ║"
echo "  ╚═══════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Detect OS ────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$ID
else
  echo "无法识别操作系统，假定为 Ubuntu"
  OS="ubuntu"
fi

echo -e "${GREEN}[1/5] 更新系统包...${NC}"
case $OS in
  ubuntu|debian)
    sudo apt-get update -qq && sudo apt-get upgrade -y -qq
    ;;
  centos|rhel|fedora)
    sudo yum update -y -q
    ;;
esac

# ── 2. Install Node.js ──────────────────────────────────
echo -e "${GREEN}[2/5] 安装 Node.js...${NC}"
if command -v node &>/dev/null; then
  echo "  Node.js 已安装: $(node -v)"
else
  case $OS in
    ubuntu|debian)
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
      sudo apt-get install -y nodejs
      ;;
    centos|rhel|fedora)
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
      sudo yum install -y nodejs
      ;;
  esac
  echo "  Node.js 安装完成: $(node -v)"
fi

# ── 3. Setup project directory ──────────────────────────
echo -e "${GREEN}[3/5] 部署项目文件...${NC}"
APP_DIR=/opt/study-buddy
sudo mkdir -p $APP_DIR
sudo cp -r ./* $APP_DIR/
sudo chown -R $USER:$USER $APP_DIR

cd $APP_DIR/relay
npm install --production

# ── 4. Configure firewall ───────────────────────────────
echo -e "${GREEN}[4/5] 配置防火墙 (开放 80 端口)...${NC}"
if command -v ufw &>/dev/null; then
  sudo ufw allow 80/tcp 2>/dev/null || true
  sudo ufw --force enable 2>/dev/null || true
elif command -v firewall-cmd &>/dev/null; then
  sudo firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
  sudo firewall-cmd --reload 2>/dev/null || true
fi

# ── 5. Setup systemd service ────────────────────────────
echo -e "${GREEN}[5/5] 设置开机自启动...${NC}"
sudo tee /etc/systemd/system/study-buddy.service > /dev/null <<SYSTEMD
[Unit]
Description=Study Buddy Relay Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/relay
ExecStart=$(which node) $APP_DIR/relay/server.js
Restart=always
RestartSec=5
Environment=PORT=80

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable study-buddy
sudo systemctl restart study-buddy

# ── Done ────────────────────────────────────────────────
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ip.sb 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo ""
echo "  访问地址:  http://${SERVER_IP}/"
echo ""
echo "  管理命令:"
echo "    sudo systemctl status study-buddy   # 查看状态"
echo "    sudo systemctl restart study-buddy  # 重启服务"
echo "    sudo journalctl -u study-buddy -f   # 查看日志"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
