FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code and data directory
COPY src/ ./src/
# Ensure data directory exists and has correct permissions for SQLite
RUN mkdir -p data && chown -R node:node data

# Switch to non-root user for security
USER node

# Expose API port
EXPOSE 4000

# Start server
CMD ["node", "src/index.js"]
