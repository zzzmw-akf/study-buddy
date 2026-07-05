FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --production

# Copy server code
COPY server.js ./

# Relay WebSocket on 8080, health check on 8081
EXPOSE 8080 8081

# Start the relay
CMD ["node", "server.js"]
