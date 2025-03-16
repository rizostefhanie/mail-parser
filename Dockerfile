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

# Expose the port the app runs on
EXPOSE 3000
# Command to run the application
CMD ["node", "dist/main"]