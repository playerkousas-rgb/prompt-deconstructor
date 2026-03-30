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

    // 臨時返回固定提示（測試用）
    const generatedPrompt = `這是一張圖片描述測試。\n\n圖片中似乎包含一些物體和場景。\n建議使用更詳細的 Prompt 來生成新圖。`;

    await fs.unlink(uploadedFile.filepath).catch(() => {});

    return res.status(200).json({ 
      prompt: generatedPrompt 
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: '目前 Hugging Face 模型暫時無法使用，請稍後再試或聯絡我調整。' 
    });
  }
}
