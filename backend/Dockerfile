# Backend API image (Express + MongoDB). Build from backend/: docker build -t tutorhub-api .
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts

# Run as a non-root user. Local uploads (development only) go to /app/data.
RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/data && chown -R app:app /app/data
USER app

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health > /dev/null || exit 1

CMD ["node", "src/server.js"]
