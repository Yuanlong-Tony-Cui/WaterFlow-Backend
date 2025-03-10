# Use an official Node.js runtime as a base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire backend source code
COPY . .

# Compile TypeScript (if using ts-node, you can skip this)
RUN npm run build

# Expose the port your server runs on
EXPOSE 3000

# Set the command to start the app
CMD ["node", "dist/server.js"]
