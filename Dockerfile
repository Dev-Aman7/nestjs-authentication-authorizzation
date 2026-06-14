
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Diagnostic: run build and list dist to verify output exists during image build
RUN npm run build && ls -la dist || true

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --production
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/keys ./keys
EXPOSE 3000
CMD ["node", "dist/main"]
