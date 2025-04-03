# Use lightweight Node.js image
FROM node:22-alpine3.18

# Set working directory
WORKDIR /app

# Copy package definition and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy app files
COPY server.js ./
COPY public/   ./public/

# Default command to run the app
CMD ["node", "./server.js"]
