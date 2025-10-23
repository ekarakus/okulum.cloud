# 1. Aşama: Angular projesini build et
FROM node:18 as build
WORKDIR /app

# package.json dosyalarını kopyala ve bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# Tüm kaynak kodları kopyala
COPY . .

# Prod build oluştur
RUN npm run build --prod

# 2. Aşama: Nginx ile sun
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
