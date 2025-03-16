FROM node:20-alpine
# Set Node.js environment to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app
# Copy source code
COPY . .
# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm ci

RUN npm run build

# Command to run the application
CMD ["node", "dist/main"]