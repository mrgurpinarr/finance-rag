import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ingestDocuments } from '@/lib/rag/ingest';
import { retrieveRelevantContext } from '@/lib/rag/retriever';

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

// Veri tabanının doldurulduğunu takip eden basit bir flag
let isIngested = false;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Mesaj alanı zorunludur.' },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API anahtarı (.env dosyasında) eksik.' },
        { status: 500 }
      );
    }

    // 1. Dokümanları lazy olarak veritabanına yükle (ingest)
    if (!isIngested) {
      await ingestDocuments();
      isIngested = true;
    }

    // 2. Retriever'ı kullanarak en benzer doküman parçalarını (context) getir
    const { contextText, chunks } = await retrieveRelevantContext(message, 3);


    // 4. Chat Completion API'ye bağlamı ekleyerek soruyu ilet
    const systemPrompt = `You are a helpful financial advisory assistant. 
Use the provided financial guide context below to answer the user's question. 
If the answer is not found in the context, use your best knowledge but state that it is not explicitly documented in the guide.

Context from the Gorvu Financial Advisory Guide:
---
${contextText}
---`;

    const chatCompletion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
    });

    const responseText = chatCompletion.choices[0]?.message?.content || 'Yanıt alınamadı.';

    return NextResponse.json({
      reply: responseText,
      sources: chunks,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Bir iç sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
