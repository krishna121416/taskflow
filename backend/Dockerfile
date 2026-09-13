FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

# Same image is used for both the API and the worker services in
# docker-compose.yml - they just override CMD. Default to the API.
CMD ["node", "src/server.js"]
