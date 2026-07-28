FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci
COPY . .
RUN npm run build --workspace=apps/backend

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --omit=dev --workspace=apps/backend
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/public ./public
EXPOSE 3000
CMD ["node", "dist/main"]
