# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Required for building native dependencies like better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create uploads directory and set permissions
RUN mkdir -p uploads && chown -R node:node uploads
RUN chown -R node:node /app

USER node

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
