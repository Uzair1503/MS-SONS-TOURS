FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN apk add --no-cache openssl
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 5000
CMD ["sh", "-c", "npx prisma generate && npx prisma db push --skip-generate && node dist/server.js"]
