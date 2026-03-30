// src/pages/api/analyze.js
import formidable from 'formidable';
import { HfInference } from '@huggingface/inference';
import fs from 'fs/promises';

export const config = {
  api: {
    bodyParser: false,   // 必須關閉，讓 formidable 自己處理
  },
};

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);  // 需要你在 Vercel 設定這個環境變數

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  try {
    const form = formidable({});

    const [fields, files] = await form.parse(req);

    const uploadedFile = files.image?.[0];   // formidable v2 回傳陣列

    if (!uploadedFile) {
      return res.status(400).json({ error: '沒有收到圖片檔案' });
    }

    // 讀取檔案內容（buffer）
    const fileBuffer = await fs.readFile(uploadedFile.filepath);

    // 呼叫 Hugging Face 模型進行圖像描述（你可以換成你原本想用的模型）
    const result = await hf.imageToText({
      data: fileBuffer,
      model: 'Salesforce/blip-image-captioning-large',   // 推薦這個模型，效果不錯
      // 其他好用模型可選：
      // 'nlpconnect/vit-gpt2-image-captioning'
      // 'Salesforce/blip2-opt-2.7b' （較強但較慢）
    });

    const generatedPrompt = result.generated_text || "無法生成描述";

    // 清理暫存檔案（重要！）
    await fs.unlink(uploadedFile.filepath).catch(() => {});

    return res.status(200).json({
      prompt: generatedPrompt,
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || '伺服器處理失敗，請稍後再試'
    });
  }
}
