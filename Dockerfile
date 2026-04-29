# Dockerfile for Moe-Counter
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Moe-Counter port
EXPOSE 3000

CMD ["npm", "start"]
