FROM node:current-alpine AS builder
WORKDIR /webviewer
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Use a lightweight web server to serve the built files
FROM nginx:alpine
COPY --from=builder /webviewer/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

