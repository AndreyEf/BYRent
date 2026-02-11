# syntax=docker/dockerfile:1
# Frontend (Node server + Vite-built client)

############################
# 1) Build stage
############################
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all deps; --ignore-scripts avoids bufferutil node-gyp (no Python), rollup native binary still present
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Build client (Vite) + server bundle (esbuild)
ENV NODE_ENV=production
RUN npm run build

############################
# 2) Runtime stage
############################
FROM node:22-alpine
WORKDIR /app

# Copy package files and install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Copy build output
COPY --from=build /app/dist ./dist

# Default: serve on 8081, proxy API to backend
ENV PORT=8081
ENV JAVA_BACKEND_URL=http://backend:8080

EXPOSE 8081

USER node

CMD ["node", "dist/index.cjs"]
