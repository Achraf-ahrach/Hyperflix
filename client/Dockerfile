# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code and build
COPY . .
# Ensure your next.config.js has 'output: "export"'
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean the default Nginx public folder
RUN rm -rf ./*

# Copy the build output from the builder stage
# Next.js exports to the 'out' directory by default
COPY --from=builder /app/out .

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


