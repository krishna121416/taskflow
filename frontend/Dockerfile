FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# The frontend runs in the USER'S BROWSER, not inside the docker network -
# so this must be a URL the browser (on the host machine) can reach, e.g.
# http://localhost:4000, NOT the internal "api" service hostname.
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
