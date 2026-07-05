@echo off
echo ========================================
echo   考研能量站 · 启动中继服务器
echo ========================================
echo.
echo 正在启动中继服务器...
start "Study Buddy Relay" cmd /c "node server.js"
echo 中继服务器已启动（后台运行）
echo.
echo 正在启动公网隧道...
echo 请稍等...
npx localtunnel --port 8080
pause
