// src/pages/api/analyze.js
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST 請求' });
  }

  try {
    const form = formidable({ keepExtensions: true, maxFileSize: 4 * 1024 * 1024 });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const uploadedFile = files.image?.[0] || files.image;
    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: '沒有收到圖片檔案' });
    }

    const fileBuffer = await fs.readFile(uploadedFile.filepath);

    // === 使用新的 Hugging Face Router Endpoint ===
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/nlpconnect/vit-gpt2-image-captioning',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new Error(`Hugging Face 錯誤: ${errorText}`);
    }

    const result = await hfResponse.json();
    const generatedPrompt = result[0]?.generated_text || result.generated_text || "無法產生描述，請再試一次。";

    // 清理暫存檔
    await fs.unlink(uploadedFile.filepath).catch(() => {});

    return res.status(200).json({ prompt: generatedPrompt });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || '分析失敗，請上傳較小的圖片再試' 
    });
  }
}
