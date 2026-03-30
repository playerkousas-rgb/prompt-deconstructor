// src/pages/index.js
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);        // 預覽圖片 (base64)
  const [selectedFile, setSelectedFile] = useState(null); // 實際檔案
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 選擇檔案 → 只預覽，不立即分析
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 預覽圖片
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setPrompt('');      // 清空之前的結果
    setError(null);
  };

  // 點擊「開始檢測」才執行 AI 分析
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('請先選擇一張圖片');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || '分析失敗，請稍後再試');
      }

      setPrompt(data.prompt || data.result || '未取得 Prompt');
  } catch (err) {
  console.error('Full error:', err);   // 加這行方便除錯
  let errorMsg = err.message;
  
  if (err.message.includes('JSON')) {
    errorMsg = '後端返回非 JSON 格式（可能是 API Key 問題或模型錯誤）';
  }
  
  setError(errorMsg);
}

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500">
          Prompt 解構引擎
        </h1>

        <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-xl">
          {/* 上傳區域 */}
          <div className="mb-10">
            <label className="block text-sm text-gray-400 mb-3">
              上傳圖片 (JPG / PNG)
            </label>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            
            <label
              htmlFor="image-upload"
              className="cursor-pointer block border-2 border-dashed border-gray-600 hover:border-cyan-400 rounded-2xl p-12 text-center transition-all"
            >
              <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                📸
              </div>
              <p className="text-gray-300 text-lg">點擊或拖曳圖片到這裡</p>
              <p className="text-gray-500 text-sm mt-1">建議使用高解析度圖片</p>
            </label>
          </div>

          {/* 圖片預覽 */}
          {image && (
            <div className="mb-10">
              <h3 className="text-sm text-gray-400 mb-3">圖片預覽</h3>
              <img
                src={image}
                alt="預覽"
                className="w-full max-h-[420px] object-contain rounded-2xl border border-gray-700 bg-black"
              />
            </div>
          )}

          {/* 檢測按鈕 */}
          {image && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-2xl font-semibold text-lg hover:brightness-110 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                  AI 正在解析 Prompt...
                </>
              ) : (
                '🚀 開始檢測 / 解構 Prompt'
              )}
            </button>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <div className="mt-6 bg-red-900/30 border border-red-700 text-red-300 p-5 rounded-2xl">
              ⚠️ {error}
            </div>
          )}

          {/* 分析結果 */}
          {prompt && (
            <div className="mt-10 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cyan-400">✅ 解構完成</h3>
                <div className="bg-gray-950 p-6 rounded-2xl border border-gray-700 overflow-auto max-h-[400px]">
                  <pre className="text-gray-200 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {prompt}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigator.clipboard.writeText(prompt)}
                  className="py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-medium transition flex items-center justify-center gap-2"
                >
                  📋 複製 Prompt
                </button>

                <a
                  href={`https://app.kandinsky.ai/create?prompt=${encodeURIComponent(prompt)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-medium hover:brightness-105 transition text-center"
                >
                  🎨 用此 Prompt 在 Kandinsky 生成圖片
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 使用技巧 */}
        <div className="mt-12 p-6 bg-gray-800/50 rounded-2xl border border-gray-700 text-sm">
          <h4 className="text-cyan-400 mb-4 font-medium">💡 使用小提醒</h4>
          <ul className="space-y-2 text-gray-400">
            <li>• 建議使用清晰、高解析度圖片（1024×1024 以上效果更好）</li>
            <li>• 人像圖可解析服裝、光影、姿勢等細節</li>
            <li>• 風景圖可提取色調、構圖、氛圍描述</li>
            <li>• 複製 Prompt 後可直接貼到 Midjourney、Kandinsky、Flux 等工具使用</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
