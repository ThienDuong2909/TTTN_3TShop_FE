# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci



COPY . .
# Nếu FE cần biết URL API, dùng biến build-time:
#   ARG VITE_API_BASE_URL
#   ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# và trong code gọi import.meta.env.VITE_API_BASE_URL
ARG VITE_GEMINI_KEY
ENV VITE_GEMINI_KEY=$VITE_GEMINI_KEY
RUN npm run build

# ---------- Serve stage ----------
FROM nginx:alpine
# (tuỳ chọn) copy cấu hình Nginx SPA fallback:
# COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
