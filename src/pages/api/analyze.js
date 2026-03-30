import { HfInference } from '@huggingface/inference';

export const config = {
  api: {
    bodyParser: false, // 禁用 JSON 解析，因為我們處理的是表單數據
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. 解析上傳的圖片
    const { files } = await new Promise((resolve, reject) => {
      const formidable = require('formidable');
      const form = formidable({ multiples: true });
      
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!imageFile) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // 2. 調用 Hugging Face API
    const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);
    const imageBuffer = await new Promise((resolve) => {
      require('fs').readFile(imageFile.path, (err, data) => {
        if (err) throw err;
        resolve(data);
      });
    });

    // 使用 CLIP Interrogator 模型
    const result = await hf.interrogate({
      model: 'pharma/ci-preprocess',
      inputs: imageBuffer,
    });

    // 3. 格式化 prompt (重點：加入設計師思維)
    const { caption, style, elements } = result;
    
    // 動態生成設計師解讀
    const designInsights = [
      `專業設計解讀: ${caption}`,
      `風格特徵: ${style.join(', ')}`,
      `核心元素: ${elements.join(', ')}`,
      `色彩分析: 高頻色調為 ${elements.filter(e => e.includes('#')).join(', ') || '無法識別'}`,
      `光影解碼: ${elements.filter(e => e.includes('light') || e.includes('shadow')).join(', ') || '均勻光線'}`
    ].join('\n');

    // SD 專用 prompt (關鍵：加入權重和負面詞)
    const sdPrompt = [
      caption,
      style.slice(0, 3).map(s => `${s} (1.2)`).join(', '),
      `colors: ${elements.filter(e => e.includes('#')).slice(0, 2).join(', ') || 'blue, gold'}`,
      `negative: lowres, blurry, text, signature, watermark, cartoon, 3D render`
    ].join(', ');

    // 4. 傳回結果
    res.status(200).json({ 
      prompt: sdPrompt,
      analysis: designInsights
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    res.status(500).json({ 
      error: error.message || 'Analysis failed',
      details: error.details
    });
  }
}
