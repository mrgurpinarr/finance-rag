# Node.js slim (Debian-based) imajını kullan (glibc içerir, onnxruntime için gereklidir)
FROM node:20-slim

# pnpm paket yöneticisini kur
RUN npm install -g pnpm

# Çalışma dizinini ayarla
WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Tüm dosyaları kopyala
COPY . .

# Portu belirle ve dışarı aç
ENV PORT 3000
EXPOSE 3000

# Geliştirici sunucusunu çalıştır
CMD ["pnpm", "run", "dev"]
