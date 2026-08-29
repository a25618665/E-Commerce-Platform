FROM node:26-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node app.js ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node views ./views

ENV NODE_ENV=development
EXPOSE 3000

USER node

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "require('node:http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "app.js"]
