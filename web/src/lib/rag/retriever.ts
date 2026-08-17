import pool from '../db';
import { getLocalEmbedding } from './embedding';

export interface RetrievedChunk {
  content: string;
  distance: number;
}

/**
 * Kullanıcı sorusunu alır, yerel model ile embedding üretir ve pgvector (PostgreSQL) 
 * üzerinde benzerlik araması (Similarity Search) yaparak en ilgili doküman parçalarını getirir.
 */
export async function retrieveRelevantContext(
  query: string, 
  limit: number = 3
): Promise<{ contextText: string; chunks: RetrievedChunk[] }> {
  console.log(`[Retriever] Arama sorgusu için yerel benzerlik araması başlatıldı: "${query.substring(0, 40)}..."`);

  // 1. Arama sorgusu (query) için yerel embedding oluştur
  const queryEmbedding = await getLocalEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // 2. pgvector ile veritabanında en yakın eşleşmeleri bul (Cosine Similarity)
  const client = await pool.connect();
  try {
    const dbRes = await client.query(
      'SELECT content, embedding <=> $1 AS distance FROM documents ORDER BY distance ASC LIMIT $2',
      [vectorStr, limit]
    );

    console.log(`[Retriever] ${dbRes.rows.length} adet yerel eşleşen parça (chunk) başarıyla getirildi.`);
    
    const chunks: RetrievedChunk[] = dbRes.rows.map((row: any, index: number) => {
      const distance = parseFloat(row.distance);
      console.log(`  -> Chunk #${index + 1} (Uzaklık/Distance: ${distance.toFixed(4)}): "${row.content.substring(0, 100)}..."`);
      return {
        content: row.content,
        distance: distance
      };
    });

    // Eşleşen metinleri birleştir
    const contextText = chunks.map(c => c.content).join('\n\n');

    return {
      contextText,
      chunks
    };
  } catch (error) {
    console.error('[Retriever] Arama sırasında hata oluştu:', error);
    throw error;
  } finally {
    client.release();
  }
}
