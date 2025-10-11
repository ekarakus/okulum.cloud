# Frontend Dockerfile for Railway
FROM nginx:alpine

# Copy built files to nginx
COPY dist/frontend-app /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
