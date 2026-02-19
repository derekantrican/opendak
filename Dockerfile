# ---- Stage 1: Build ----
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY public/ public/
COPY src/ src/
COPY opendak-settings.json ./

RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:stable-alpine

# Copy custom Nginx config for SPA routing
COPY --from=build /app/build /usr/share/nginx/html

# Support client-side routing — serve index.html for all unknown paths
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Cache static assets aggressively\n\
    location /static/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
