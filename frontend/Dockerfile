FROM node:20-alpine AS build

ENV ROLLUP_USE_WASM=true

WORKDIR /app
COPY package*.json ./

# ❗ DELETE the lockfile inside container (forces WASM-compatible install)
RUN rm -f package-lock.json

# Install dependencies cleanly (safe for ARM)
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
