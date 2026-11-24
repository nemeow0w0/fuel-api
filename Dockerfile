FROM node:26-alpine3.24

WORKDIR /services

COPY package*.json ./

COPY index.js ./

ENV PORT 8987

HEALTHCHECK --interval=10s CMD wget -qO- http://localhost:8987/health || exit 1

USER node

CMD ["node", "server.js"]
