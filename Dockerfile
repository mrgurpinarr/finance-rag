# Python tabanlı resmi ince imajı kullan
FROM python:3.11-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Bağımlılık dosyasını kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodlarını ve verileri kopyala
COPY finance_advisor.py .
COPY finance_guide.txt .

# Çevre değişkenlerinin doğru okunabilmesi için Python'ın çıktı tamponlamasını kapat
ENV PYTHONUNBUFFERED=1

# Scripti çalıştır
CMD ["python", "finance_advisor.py"]
