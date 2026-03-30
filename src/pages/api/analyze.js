// src/pages/api/analyze.js
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,        // 重要！必須關閉
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST 請求' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 4 * 1024 * 1024,   // 限制單檔最大 4MB
    });

    // 使用 Promise 包裝 parse（最穩定寫法）
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const uploadedFile = files.image?.[0] || files.image;

    if (!uploadedFile || !uploadedFile.filepath) {
      return res.status(400).json({ error: '沒有收到有效的圖片檔案' });
    }

    // 讀取檔案成 buffer
    const fileBuffer = await fs.readFile(uploadedFile.filepath);

    // 直接呼叫 Hugging Face Inference API（純 fetch，最穩定）
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning',
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

    // 清理暫存檔案
    await fs.unlink(uploadedFile.filepath).catch(() => {});

    return res.status(200).json({ prompt: generatedPrompt });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message.includes('Payload too large') 
        ? '圖片太大！請上傳小於 3MB 的圖片' 
        : (error.message || '分析失敗，請稍後再試')
    });
  }
}
