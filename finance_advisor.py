import os
import time
from openai import OpenAI
from dotenv import load_dotenv

# .env dosyasından API anahtarını yükle
load_dotenv()

# OpenAI istemcisini başlat
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def setup_rag_assistant():
    print("1. Finans rehberi yükleniyor ve vektör veri deposu oluşturuluyor...")
    # 1. Dosyayı OpenAI'a yükle
    file_path = "finance_guide.txt"
    with open(file_path, "rb") as f:
        uploaded_file = client.files.create(
            file=f,
            purpose="assistants"
        )
    
    # 2. Vektör deposu oluştur
    vector_store = client.beta.vector_stores.create(
        name="Finance Advisory Guide Store"
    )
    
    # 3. Dosyayı vektör deposuna ekle ve işlemin tamamlanmasını bekle
    file_batch = client.beta.vector_stores.file_batches.create_and_poll(
        vector_store_id=vector_store.id,
        file_ids=[uploaded_file.id]
    )
    print(f"Vektör deposu durumu: {file_batch.status}")

    print("2. RAG destekli Asistan oluşturuluyor...")
    # 4. Asistanı oluştur ve vektör deposunu bağla
    assistant = client.beta.assistants.create(
        name="Gorvu Finance Advisor",
        instructions="You are a helpful financial advisory assistant. Use the provided financial guide to answer questions.",
        tools=[{"type": "file_search"}],
        model="gpt-4o",
        tool_resources={
            "file_search": {
                "vector_store_ids": [vector_store.id]
            }
        }
    )
    return assistant, vector_store, uploaded_file

def main():
    if not os.getenv("OPENAI_API_KEY"):
        print("HATA: Lütfen .env dosyasında OPENAI_API_KEY tanımlayın.")
        return

    # RAG Asistanı kur
    assistant, vector_store, uploaded_file = setup_rag_assistant()
    
    try:
        print("3. Yeni bir konuşma (thread) başlatılıyor...")
        # Yeni bir thread oluştur
        thread = client.beta.threads.create()

        print("4. Kullanıcı mesajı ekleniyor...")
        # Kullanıcı mesajını thread'e ekle
        message = client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content="You have $10,000 to invest. You want to double your money in 20 years. What average return will you need to get according to the Gorvu Financial Advisory Guide?"
        )

        print("5. Asistan çalıştırılıyor (Run)...")
        # Run başlat
        run = client.beta.threads.runs.create_and_poll(
            thread_id=thread.id,
            assistant_id=assistant.id
        )

        # Durumu kontrol et
        if run.status == "completed":
            print("\n6. Yanıt Alındı:")
            messages = client.beta.threads.messages.list(
                thread_id=thread.id
            )
            for msg in reversed(messages.data):
                role = msg.role
                for content_block in msg.content:
                    if content_block.type == 'text':
                        print(f"\n[{role.upper()}]: {content_block.text.value}")
        else:
            print(f"Çalıştırma tamamlanamadı. Durum: {run.status}")

    finally:
        # Kaynakları temizleme (İsteğe bağlı)
        print("\n7. Kaynaklar temizleniyor...")
        client.beta.assistants.delete(assistant.id)
        client.beta.vector_stores.delete(vector_store.id)
        client.files.delete(uploaded_file.id)
        print("Temizlik tamamlandı.")

if __name__ == "__main__":
    main()
