// src/pages/api/analyze.js
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
  api: { bodyParser: false },
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

    // 使用目前較穩定的模型
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-large',
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
    let generatedPrompt = result[0]?.generated_text || result.generated_text;

    if (!generatedPrompt || generatedPrompt.length < 10) {
      generatedPrompt = "這是一張美麗的圖片，適合用來生成藝術作品。";
    }

    await fs.unlink(uploadedFile.filepath).catch(() => {});

    return res.status(200).json({ prompt: generatedPrompt });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'AI 分析暫時無法使用，請稍後再試或上傳較小的圖片。' 
    });
  }
}
