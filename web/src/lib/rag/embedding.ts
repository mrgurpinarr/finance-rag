import { pipeline } from '@xenova/transformers';

let extractorInstance: any = null;

async function getExtractor() {
  if (!extractorInstance) {
    console.log('[Embedding] Yerel model yükleniyor: Xenova/all-MiniLM-L6-v2...');
    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log(`[Embedding] Model yüklendi, sürüm: ${extractorInstance.version || 'Bilinmiyor'}`);
  }
  return extractorInstance;
}

//convert the text to vectors for RAG

export async function getLocalEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Float32Array type to array for pgvector
  return Array.from(output.data);
}
