import fs from 'fs';
import path from 'path';
import pool from '../db';
import { getLocalEmbedding } from './embedding';

interface DocumentItem {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

/**
 * finance_docs.json dosyasını okur, veritabanı tablosunu hazırlar,
 * metinleri yerel model ile 384 boyutlu vektöre çevirir ve metadata ile birlikte pgvector'e kaydeder.
 */
export async function ingestDocuments() {
  const client = await pool.connect();
  try {
    console.log('[Ingestion] Veritabanı kontrol ediliyor ve pgvector uzantısı aktif ediliyor...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    
    // Şema değiştiği için eski tabloyu düşürüp yeni sütunlarla oluşturuyoruz (id ve metadata ekledik)
    await client.query('DROP TABLE IF EXISTS documents CASCADE;');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(50) PRIMARY KEY,
        content TEXT UNIQUE,
        metadata JSONB,
        embedding vector(384)
      );
    `);

    // JSON dosyasını oku
    let filePath = path.join(process.cwd(), '..', 'finance_docs.json');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'finance_docs.json');
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`[Ingestion] finance_docs.json bulunamadı! Yol: ${filePath}`);
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const documents: DocumentItem[] = JSON.parse(fileContent);

    console.log(`[Ingestion] ${documents.length} adet doküman nesnesi yüklendi. İşleniyor...`);

    for (const doc of documents) {
      console.log(`[Ingestion] "${doc.id}" için embedding oluşturuluyor...`);
      
      // Yerel model ile metinden embedding oluşturma
      const embedding = await getLocalEmbedding(doc.text);
      const vectorStr = `[${embedding.join(',')}]`;

      await client.query(
        `INSERT INTO documents (id, content, metadata, embedding) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET 
           content = EXCLUDED.content, 
           metadata = EXCLUDED.metadata, 
           embedding = EXCLUDED.embedding`,
        [doc.id, doc.text, JSON.stringify(doc.metadata), vectorStr]
      );
    }

    console.log('[Ingestion] Yapılandırılmış veri yükleme (ingestion) başarıyla tamamlandı.');
  } catch (error) {
    console.error('[Ingestion] Hata oluştu:', error);
  } finally {
    client.release();
  }
}
