// Fix 404 with rewrite - March 2026
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 顯示預覽
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
    
    // 傳送到後端
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrompt(data.prompt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500">
          Prompt 解構引擎
        </h1>

        <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">
              上傳圖片 (JPG/PNG)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-cyan-400 transition">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L12 9.9M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span className="text-gray-400">點擊上傳或拖曳圖片到這裡</span>
              </label>
            </div>
          </div>

          {image && (
            <div className="mb-8">
              <h3 className="text-sm text-gray-400 mb-2">預覽</h3>
              <img 
                src={image} 
                alt="Uploaded" 
                className="w-full h-64 object-contain rounded-xl border border-gray-700"
              />
            </div>
          )}

          {loading && (
            <div className="flex justify-center mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              <span className="ml-3 text-gray-400">分析中... (約 5-10 秒)</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-xl mb-8">
              {error}
            </div>
          )}

          {prompt && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-gray-400 mb-2">解構完成！</h3>
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                  <pre className="text-gray-300 text-sm leading-relaxed font-mono">
                    {prompt}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => navigator.clipboard.writeText(prompt)}
                  className="bg-gradient-to-r from-cyan-500 to-violet-500 py-3 px-6 rounded-xl font-medium hover:brightness-110 transition"
                >
                  📋 複製 Prompt
                </button>
                <a 
                  href={`https://app.kandinsky.ai/create?prompt=${encodeURIComponent(prompt)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-600 transition text-center"
                >
                  🎨 用此 Prompt 生成新圖 (Kandinsky)
                </a>
              </div>
            </div>
          )}

          <div className="mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <h4 className="text-sm text-cyan-400 mb-2">💡 使用技巧</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• 優先上傳 <span className="text-white">高解析度圖片</span> (≥1024x1024)</li>
              <li>• 人像圖會識別 <span className="text-white">服裝材質</span> 和 <span className="text-white">光影方向</span></li>
              <li>• 風景圖會提取 <span className="text-white">色調分佈</span> 和 <span className="text-white">構圖規律</span></li>
              <li>• 用複製的 Prompt 生成時，<span className="text-white">加入 --ar 16:9</span> 會更準確</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
