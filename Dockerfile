# Use a lightweight Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production

# Copy source code
COPY . .

# Create the public/generated directory
RUN mkdir -p public/generated

# Set the PORT environment variable
ENV PORT=3033

# Expose the port
EXPOSE 3033

# Start the application
CMD ["npm", "start"]
