// src/pages/api/analyze.js
import formidable from 'formidable';
import { HfInference } from '@huggingface/inference';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST 請求' });
  }

  try {
    const form = formidable({ multiples: false });

    // 使用 Promise 包裝 parse，比較穩定
    const parseForm = () => 
      new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve({ fields, files });
        });
      });

    const { files } = await parseForm();

    const uploadedFile = files.image;

    if (!uploadedFile) {
      return res.status(400).json({ error: '沒有收到圖片' });
    }

    // formidable v2 中檔案可能是陣列或單一物件
    const fileObj = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    if (!fileObj || !fileObj.filepath) {
      return res.status(400).json({ error: '檔案處理失敗' });
    }

    // 讀取檔案 buffer
    const fileBuffer = await fs.readFile(fileObj.filepath);

    // 呼叫 Hugging Face 圖像轉文字
    const result = await hf.imageToText({
      data: fileBuffer,
      model: 'Salesforce/blip-image-captioning-large',   // 穩定且效果好的模型
    });

    const generatedPrompt = result.generated_text || "無法產生描述，請再試一次。";

    // 清理暫存檔案
    await fs.unlink(fileObj.filepath).catch(() => {});

    return res.status(200).json({ 
      prompt: generatedPrompt 
    });

  } catch (error) {
    console.error('Analyze API Error:', error);
    return res.status(500).json({ 
      error: error.message || '伺服器發生錯誤，請稍後再試' 
    });
  }
}
