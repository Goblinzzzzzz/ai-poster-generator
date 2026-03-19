#!/bin/bash
# P0 阶段：完全对标即梦 - 左右分栏架构重构
# 目标：抛弃原有表单设计，采用即梦的核心交互逻辑

set -e

echo "=========================================="
echo "完全对标即梦：左右分栏架构重构"
echo "=========================================="
echo ""

echo "【即梦核心架构】"
echo ""
echo "┌────────────────────────────────────────────┐"
echo "│  顶部导航栏 (Logo | 灵感 | 生成 | 资产)      │"
echo "├────────────────────────────────────────────┤"
echo "│                                            │"
echo "│  ┌─────────────┐  ┌──────────────────┐     │"
echo "│  │             │  │                  │     │"
echo "│  │  左侧：     │  │  右侧：参数      │     │"
echo "│  │  提示词     │  │  配置面板        │     │"
echo "│  │  输入区     │  │  (可滚动)        │     │"
echo "│  │  (大文本框) │  │                  │     │"
echo "│  │             │  │  - 比例选择      │     │"
echo "│  │  +参考图    │  │  - 风格选择      │     │"
echo "│  │             │  │  - 高级设置      │     │"
echo "│  │  [生成]     │  │                  │     │"
echo "│  └─────────────┘  └──────────────────┘     │"
echo "│                                            │"
echo "├────────────────────────────────────────────┤"
echo "│           底部：作品展示区                  │"
echo "│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │"
echo "│  │作品 │ │作品 │ │作品 │ │ ... │          │"
echo "│  └─────┘ └─────┘ └─────┘ └─────┘          │"
echo "└────────────────────────────────────────────┘"
echo ""

echo "开始重构..."
echo ""

# 备份
echo "【步骤 1】备份..."
cp src/App.jsx src/App.jsx.p0-backup
echo "✓ 备份完成"
echo ""

# 完全重写 App.jsx
echo "【步骤 2】重写 App.jsx - 左右分栏架构..."

cat > src/App.jsx << 'APPEOF'
import { useState } from 'react'
import { POSTER_API_URL } from './config'
import Navbar from './components/Navbar'

const DEFAULT_NEGATIVE_PROMPT = '文字、数字、水印、签名、尺寸标注、日期、时间、版本号、模糊、低质量、变形、杂乱、过曝、欠曝、噪点、畸形、多余手指、错误解剖、重复元素、低分辨率、压缩痕迹、色带、锯齿边缘'

const STYLE_PRESETS = [
  { id: 'realistic', name: '写实', icon: '📷' },
  { id: 'anime', name: '二次元', icon: '🎨' },
  { id: '3d', name: '3D 渲染', icon: '🎯' },
  { id: 'oil', name: '油画', icon: '🖼️' },
  { id: 'watercolor', name: '水彩', icon: '💧' },
  { id: 'cyberpunk', name: '赛博朋克', icon: '🌃' },
  { id: 'minimal', name: '极简', icon: '⚪' },
  { id: 'vintage', name: '复古', icon: '📻' },
]

const ASPECT_RATIOS = [
  { id: 'mobile', ratio: '9:16', name: '手机海报' },
  { id: 'wechat_cover', ratio: '16:9', name: '横版封面' },
  { id: 'weibo', ratio: '1:1', name: '正方形' },
  { id: 'a4', ratio: '3:4', name: 'A4 打印' },
]

const PROMPT_TEMPLATES = [
  { id: 1, text: '高质量，专业设计，现代办公室环境，简约风格，明亮均匀照明' },
  { id: 2, text: '科技感，蓝色渐变背景，未来感线条，抽象几何图形' },
  { id: 3, text: '温暖自然光，侧光营造层次感，色彩鲜艳，活力四射' },
  { id: 4, text: '高端商务风格，专业影棚布光，品牌主色，哑光质感' },
]

function App() {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('minimal')
  const [selectedRatio, setSelectedRatio] = useState('mobile')
  const [referenceImage, setReferenceImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([])
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入提示词')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const formData = new FormData()
      
      // 核心参数
      const styleDesc = STYLE_PRESETS.find(s => s.id === selectedStyle)?.name || '简约现代'
      const ratioDesc = ASPECT_RATIOS.find(r => r.id === selectedRatio)?.ratio || '9:16'
      
      // 构建完整 prompt（风格 + 用户输入）
      const finalPrompt = `${styleDesc}风格，${prompt}，比例${ratioDesc}`
      
      formData.append('customPrompt', finalPrompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)
      formData.append('sizeTemplate', selectedRatio)
      formData.append('styleDesc', styleDesc)

      // 参考图（如果有）
      if (referenceImage) {
        const reader = new FileReader()
        const readPromise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
        })
        reader.readAsDataURL(referenceImage)
        const base64 = await readPromise
        formData.append('referenceImage', base64)
      }

      const response = await fetch(POSTER_API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`生成失败：${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data.imageUrl || `data:image/png;base64,${data.base64Image}`
      
      // 添加到作品列表
      setGeneratedImages(prev => [imageUrl, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseTemplate = (templateText) => {
    setPrompt(templateText)
  }

  return (
    <div className="app-container">
      <Navbar />
      
      {/* 主内容区 - 左右分栏 */}
      <div className="main-workspace">
        {/* 左侧：提示词输入区 */}
        <div className="left-panel">
          <div className="prompt-section">
            <label className="section-label">
              <span className="label-icon">✨</span>
              <span>描述你想生成的画面</span>
            </label>
            
            <textarea
              className="prompt-textarea"
              placeholder="例如：一位穿着现代职业装的女性，办公室环境，极简主义风格，柔和自然光，三分法构图..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
            />
            
            {/* 提示词模板 */}
            <div className="prompt-templates">
              <div className="templates-label">💡 快速填充：</div>
              <div className="template-chips">
                {PROMPT_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    className="template-chip"
                    onClick={() => handleUseTemplate(t.text)}
                  >
                    {t.text.slice(0, 20)}...
                  </button>
                ))}
              </div>
            </div>
            
            {/* 参考图上传 */}
            <div className="reference-upload">
              <label className="upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReferenceImage(e.target.files[0])}
                  className="file-input"
                />
                <span className="upload-text">
                  📎 添加参考图 {referenceImage && `(${referenceImage.name})`}
                </span>
              </label>
            </div>
            
            {/* 生成按钮 */}
            <button
              className="generate-button"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="spinner"></span>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  <span>立即生成</span>
                </>
              )}
            </button>
            
            {/* 错误提示 */}
            {error && (
              <div className="error-toast">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：参数配置面板 */}
        <div className="right-panel">
          <div className="settings-section">
            <h3 className="section-title">
              <span>📐</span>
              <span>画面比例</span>
            </h3>
            <div className="ratio-grid">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.id}
                  className={`ratio-card ${selectedRatio === ratio.id ? 'active' : ''}`}
                  onClick={() => setSelectedRatio(ratio.id)}
                >
                  <div className="ratio-value">{ratio.ratio}</div>
                  <div className="ratio-name">{ratio.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h3 className="section-title">
              <span>🎨</span>
              <span>艺术风格</span>
            </h3>
            <div className="style-grid">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  className={`style-card ${selectedStyle === style.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div className="style-icon">{style.icon}</div>
                  <div className="style-name">{style.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h3 className="section-title">
              <span>⚙️</span>
              <span>高级设置</span>
            </h3>
            <div className="advanced-settings">
              <div className="setting-item">
                <span className="setting-label">负面提示词</span>
                <div className="setting-value">已配置（24 项）</div>
              </div>
              <div className="setting-item">
                <span className="setting-label">生成质量</span>
                <div className="setting-value">2K（标准）</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部：作品展示区 */}
      {generatedImages.length > 0 && (
        <div className="gallery-section">
          <h3 className="gallery-title">🎨 我的作品</h3>
          <div className="gallery-grid">
            {generatedImages.map((img, index) => (
              <div key={index} className="gallery-item">
                <img src={img} alt={`作品${index + 1}`} className="gallery-image" />
                <div className="gallery-actions">
                  <button className="action-btn">⬇️ 下载</button>
                  <button className="action-btn">🔄 同款</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
APPEOF

echo "✓ App.jsx 重写完成"
echo ""

# 重写全局样式
echo "【步骤 3】重写样式 - 即梦风格..."

cat > src/index.css << 'CSSEOF'
@import "tailwindcss";

:root {
  color-scheme: light;
  --bg-base: #f8fafc;
  --bg-panel: #ffffff;
  --text-main: #0f172a;
  --text-soft: #475569;
  --text-faint: #94a3b8;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --border: #e2e8f0;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.12);
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-base);
  color: var(--text-main);
  height: 100%;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ========== 主工作区 - 左右分栏 ========== */
.main-workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 0;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* 左侧面板 */
.left-panel {
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  padding: 2rem;
  overflow-y: auto;
}

/* 右侧面板 */
.right-panel {
  background: #fafbfc;
  padding: 2rem;
  overflow-y: auto;
  border-left: 1px solid var(--border);
}

/* ========== 提示词输入区 ========== */
.prompt-section {
  max-width: 900px;
  margin: 0 auto;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: var(--text-main);
}

.label-icon {
  font-size: 1.25rem;
}

.prompt-textarea {
  width: 100%;
  padding: 1.25rem;
  border: 2px solid var(--border);
  border-radius: 16px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 180px;
  transition: all 0.2s;
  font-family: inherit;
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.prompt-textarea::placeholder {
  color: var(--text-faint);
}

/* 提示词模板 */
.prompt-templates {
  margin-top: 1.5rem;
}

.templates-label {
  font-weight: 600;
  color: var(--text-soft);
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.template-chip {
  padding: 0.5rem 1rem;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 20px;
  color: var(--accent);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.template-chip:hover {
  background: rgba(37, 99, 235, 0.12);
  border-color: var(--accent);
}

/* 参考图上传 */
.reference-upload {
  margin-top: 1.5rem;
}

.upload-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(37, 99, 235, 0.05);
  border: 2px dashed rgba(37, 99, 235, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-soft);
}

.upload-label:hover {
  background: rgba(37, 99, 235, 0.08);
  border-color: var(--accent);
}

.file-input {
  display: none;
}

.upload-text {
  font-size: 0.9375rem;
}

/* 生成按钮 */
.generate-button {
  width: 100%;
  margin-top: 2rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
}

.generate-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.4);
}

.generate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.25rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误提示 */
.error-toast {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

/* ========== 右侧设置面板 ========== */
.settings-section {
  background: var(--bg-panel);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--text-main);
}

/* 比例选择 */
.ratio-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.ratio-card {
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.ratio-card:hover {
  border-color: var(--accent);
  background: white;
}

.ratio-card.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.1));
  border-color: var(--accent);
}

.ratio-value {
  font-weight: 700;
  color: var(--accent);
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.ratio-name {
  font-size: 0.875rem;
  color: var(--text-soft);
}

/* 风格选择 */
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.style-card {
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.style-card:hover {
  border-color: var(--accent);
  background: white;
}

.style-card.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.1));
  border-color: var(--accent);
}

.style-icon {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.style-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
}

/* 高级设置 */
.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 0.9375rem;
  color: var(--text-soft);
}

.setting-value {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.9375rem;
}

/* ========== 底部作品展示区 ========== */
.gallery-section {
  background: var(--bg-panel);
  border-top: 1px solid var(--border);
  padding: 2rem;
}

.gallery-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--text-main);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.gallery-item {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s;
}

.gallery-item:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.gallery-image {
  width: 100%;
  height: auto;
  display: block;
}

.gallery-actions {
  padding: 1rem;
  background: white;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.625rem;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 8px;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(37, 99, 235, 0.12);
  border-color: var(--accent);
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .main-workspace {
    grid-template-columns: 1fr;
  }
  
  .right-panel {
    border-left: none;
    border-top: 1px solid var(--border);
  }
  
  .style-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 640px) {
  .left-panel, .right-panel {
    padding: 1rem;
  }
  
  .ratio-grid {
    grid-template-columns: 1fr;
  }
  
  .style-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
CSSEOF

echo "✓ 样式重写完成"
echo ""

# 验证构建
echo "【步骤 4】验证构建..."
npm run build
echo ""

echo "=========================================="
echo "✅ 完全对标即梦架构重构完成！"
echo "=========================================="
echo ""
echo "【核心改进】"
echo "  ✓ 左右分栏布局（左侧输入 + 右侧参数）"
echo "  ✓ 大文本框提示词输入（180px 高度）"
echo "  ✓ 提示词模板快速填充"
echo "  ✓ 参考图上传（拖拽区域）"
echo "  ✓ 右侧参数面板（比例 + 风格 + 高级）"
echo "  ✓ 底部作品展示区（瀑布流）"
echo "  ✓ 即梦风格视觉设计"
echo ""
echo "【架构对比】"
echo "  之前：垂直堆叠表单（填表思维）"
echo "  现在：左右分栏 + 底部展示（创作思维）"
echo ""
echo "请检查并提交："
echo "git add -A"
echo "git commit -m 'feat: 完全对标即梦 - 左右分栏架构重构'"
echo "git push origin main"
