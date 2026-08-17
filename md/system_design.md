# Gorvu LLC - Finance Advisor RAG System Design

Bu belgede, projenin verileri nasıl işlediği (Ingestion) ve kullanıcılardan gelen sorulara nasıl yanıt verdiği (Retrieval & Generation) basit ve anlaşılır bir şema ile açıklanmıştır.

---

## Basit Sistem Mimarisi Şeması

```text
===================================================================
1. ADIM: VERİ YÜKLEME AŞAMASI (INGESTION PHASE)
===================================================================

 [ finance_guide.txt ]  <--- Ham Metin Dosyası
        │
        ▼ (Paragraflara Bölme - Chunking)
 [ Paragraf 1 ]  [ Paragraf 2 ]  [ Paragraf 3 ]
        │               │               │
        ▼               ▼               ▼ (Vektör Oluşturma - OpenAI)
 [ Vektör 1 ]    [ Vektör 2 ]    [ Vektör 3 ]  (1536 boyutlu sayısal değer)
        │               │               │
        └───────────────┼───────────────┘
                        ▼ (Veritabanına Kaydetme)
         [( PostgreSQL + pgvector )]  <--- Yerel Vektör Depomuz


===================================================================
2. ADIM: SORU-CEVAP AŞAMASI (RETRIEVAL & GENERATION)
===================================================================

  [ Web UI / Kullanıcı Sorusu ]  (Örn: "Parayı 20 yılda nasıl katlarım?")
        │
        ▼ (OpenAI ile Soru Vektörünü Hesaplama)
  [ Sorunun Vektör Değeri ]
        │
        ▼ (Yerel pgvector Veritabanında Semantik Arama)
   ┌────┴───────────────────────────┐
   │ En yakın benzerlikteki         │ <---> [( PostgreSQL + pgvector )]
   │ en alakalı 3 paragrafı getir. │
   └────┬───────────────────────────┘
        │
        ▼ (Eşleşen Paragrafları ve Soruyu Birleştirme)
  [ Sistem Talimatı (Prompt) + En Yakın 3 Paragraf + Soru ]
        │
        ▼ (Yapay Zeka API'sine Gönderme)
  [ DeepSeek API (deepseek-chat) ]
        │
        ▼ (Metin Olarak Yanıt Üretme)
  [ Yapay Zeka Cevabı ] ───> [ Web UI / Arayüze Yazdırma ]
```

---

## Temel Bileşenler Ne İşe Yarar?

* **finance_guide.txt:** RAG sisteminin referans alacağı tek bilgi kaynağımız (finans kılavuzumuz).
* **Parçalama (Chunking):** Metinleri küçük parçalara (paragraflara) bölerek arama doğruluğunu artırıyoruz.
* **Vektörleştirme (Embedding):** Kelimelerin matematiksel/anlamsal haritasını çıkartarak bilgisayarların benzerlik araması yapabilmesini sağlıyoruz.
* **pgvector:** Postgres üzerinde vektörler arası mesafe hesabı yaparak en doğru paragrafı bulur.
* **DeepSeek:** Getirilen bu doğru paragrafları okuyarak kullanıcıya düzgün cümlelerle yanıt yazan ana yapay zeka modelidir.
