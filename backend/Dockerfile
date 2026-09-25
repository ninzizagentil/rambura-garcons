FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p /app/uploads /app/backups && chown -R node:node /app
EXPOSE 5000
USER node
CMD ["node", "src/server.js"]
