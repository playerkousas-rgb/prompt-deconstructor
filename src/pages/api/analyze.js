// src/pages/api/analyze.js
import fs from 'fs/promises';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST' });
  }

  try {
    // 使用內建的 formidable 替代方案（或保持你原本的 formidable）
    const formData = await new Response(req.body).formData(); // 簡化寫法
    const file = formData.get('image');

    if (!file) {
      return res.status(400).json({ error: '沒有收到圖片' });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 直接用 fetch 呼叫 Hugging Face Inference API（更穩定）
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new Error(`Hugging Face 錯誤: ${errorText}`);
    }

    const result = await hfResponse.json();
    const prompt = result[0]?.generated_text || '無法產生描述';

    return res.status(200).json({ prompt });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || '分析失敗，請試較小的圖片' 
    });
  }
}
