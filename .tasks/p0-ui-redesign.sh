#!/bin/bash
# P0 阶段：即梦风格 UI 改版 - 具体修改方案
# 目标：对标即梦网页版，优化核心用户体验

set -e

echo "=========================================="
echo "P0 阶段：即梦风格 UI 改版"
echo "=========================================="
echo ""

echo "【修改方案概览】"
echo ""
echo "1. 顶部导航栏改造"
echo "   - 添加 Logo + 导航菜单（灵感/生成/资产/画布）"
echo "   - 右侧用户登录区域"
echo "   - 即梦风格：简洁、现代、渐变"
echo ""

echo "2. 提示词输入区优化"
echo "   - 统一为大文本框（替代分散的表单字段）"
echo "   - 添加占位符引导文案"
echo "   - 智能辅助按钮（优化提示词/使用模板/寻找灵感）"
echo "   - 实时字数统计"
echo ""

echo "3. 风格预设可视化选择器"
echo "   - 6-8 个风格卡片（写实/二次元/3D/油画/水彩/赛博朋克）"
echo "   - 点击选择，带预览图"
echo "   - 选中状态高亮"
echo ""

echo "4. 比例可视化选择器"
echo "   - 替代下拉框，使用图标 + 文字"
echo "   - 9:16（手机海报）/ 16:9（横版封面）/ 1:1（正方形）/ 3:4（A4 打印）"
echo "   - 每个选项显示比例和用途说明"
echo ""

echo "5. 提示词模板库"
echo "   - 10-15 个常用模板"
echo "   - 分类展示（海报/营销/社交媒体）"
echo "   - 点击一键填充"
echo ""

echo "6. 扩展负面提示词"
echo "   - 按即梦最佳实践扩展"
echo "   - 默认包含：文字、数字、水印、签名、尺寸标注等"
echo ""

echo "=========================================="
echo "开始执行修改..."
echo "=========================================="
echo ""

# 备份原文件
echo "【步骤 1】备份原文件..."
cp src/App.jsx src/App.jsx.backup
cp src/index.css src/index.css.backup
echo "✓ 备份完成"
echo ""

# 创建新的组件文件
echo "【步骤 2】创建新组件文件..."

# 1. 顶部导航栏组件
cat > src/components/Navbar.jsx << 'EOF'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">AI Poster Generator</span>
        </div>
        
        {/* 导航菜单 */}
        <div className="navbar-menu">
          <a href="#" className="menu-item">
            <span className="menu-icon">💡</span>
            <span>灵感</span>
          </a>
          <a href="#" className="menu-item active">
            <span className="menu-icon">✨</span>
            <span>生成</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">📁</span>
            <span>资产</span>
          </a>
          <a href="#" className="menu-item">
            <span className="menu-icon">🖼️</span>
            <span>画布</span>
          </a>
        </div>
        
        {/* 用户区域 */}
        <div className="navbar-user">
          <button className="btn-login">登录</button>
        </div>
      </div>
    </nav>
  )
}
EOF

# 2. 导航栏样式
cat > src/components/Navbar.css << 'EOF'
.navbar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 255, 0.9));
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 2px 20px rgba(37, 99, 235, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-icon {
  font-size: 1.75rem;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  color: #475569;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
}

.menu-item:hover {
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
  color: #2563eb;
  font-weight: 600;
}

.menu-icon {
  font-size: 1.125rem;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-login {
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}
EOF

echo "✓ 创建导航栏组件"

# 3. 提示词输入组件
cat > src/components/PromptInput.jsx << 'EOF'
import { useState } from 'react'
import './PromptInput.css'

export default function PromptInput({ value, onChange, onUseTemplate, onOptimize }) {
  const [charCount, setCharCount] = useState(value?.length || 0)
  
  const handleChange = (e) => {
    const newValue = e.target.value
    setCharCount(newValue.length)
    onChange(newValue)
  }
  
  return (
    <div className="prompt-input-container">
      <label className="input-label">
        <span className="label-icon">✨</span>
        <span>描述你想生成的海报</span>
      </label>
      
      <textarea
        className="prompt-textarea"
        placeholder="例如：一位穿着现代职业装的女性，办公室环境，极简主义风格，柔和自然光，三分法构图，专业蓝色调..."
        value={value}
        onChange={handleChange}
        rows={4}
        maxLength={1000}
      />
      
      <div className="input-footer">
        <div className="char-count">
          {charCount}/1000
        </div>
        
        <div className="helper-buttons">
          <button 
            className="btn-helper"
            onClick={onOptimize}
            title="AI 优化提示词"
          >
            <span className="btn-icon">✨</span>
            <span>优化</span>
          </button>
          
          <button 
            className="btn-helper"
            onClick={onUseTemplate}
            title="使用模板"
          >
            <span className="btn-icon">📝</span>
            <span>模板</span>
          </button>
          
          <button 
            className="btn-helper"
            title="寻找灵感"
          >
            <span className="btn-icon">💡</span>
            <span>灵感</span>
          </button>
        </div>
      </div>
    </div>
  )
}
EOF

# 4. 提示词输入样式
cat > src/components/PromptInput.css << 'EOF'
.prompt-input-container {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  margin-bottom: 1.5rem;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.label-icon {
  font-size: 1.25rem;
}

.prompt-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s ease;
  background: rgba(248, 250, 255, 0.5);
}

.prompt-textarea:focus {
  outline: none;
  border-color: #2563eb;
  background: white;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.prompt-textarea::placeholder {
  color: #94a3b8;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.char-count {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.helper-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-helper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 10px;
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-helper:hover {
  background: rgba(37, 99, 235, 0.12);
  border-color: #2563eb;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}
EOF

echo "✓ 创建提示词输入组件"

# 5. 风格选择器组件
cat > src/components/StyleSelector.jsx << 'EOF'
import './StyleSelector.css'

const STYLE_PRESETS = [
  { id: 'realistic', name: '写实', icon: '📷', desc: '真实摄影质感' },
  { id: 'anime', name: '二次元', icon: '🎨', desc: '动漫插画风格' },
  { id: '3d', name: '3D 渲染', icon: '🎯', desc: '三维立体效果' },
  { id: 'oil', name: '油画', icon: '🖼️', desc: '经典油画质感' },
  { id: 'watercolor', name: '水彩', icon: '💧', desc: '水彩画风格' },
  { id: 'cyberpunk', name: '赛博朋克', icon: '🌃', desc: '未来科技感' },
  { id: 'minimal', name: '极简', icon: '⚪', desc: '简约现代设计' },
  { id: 'vintage', name: '复古', icon: '📻', desc: '怀旧复古风格' },
]

export default function StyleSelector({ value, onChange }) {
  return (
    <div className="style-selector">
      <label className="selector-label">
        <span className="label-icon">🎨</span>
        <span>选择风格</span>
      </label>
      
      <div className="style-grid">
        {STYLE_PRESETS.map(style => (
          <div
            key={style.id}
            className={`style-card ${value === style.id ? 'selected' : ''}`}
            onClick={() => onChange(style.id)}
          >
            <div className="style-icon">{style.icon}</div>
            <div className="style-name">{style.name}</div>
            <div className="style-desc">{style.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
EOF

# 6. 风格选择器样式
cat > src/components/StyleSelector.css << 'EOF'
.style-selector {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  margin-bottom: 1.5rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.label-icon {
  font-size: 1.25rem;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  background: rgba(248, 250, 255, 0.5);
  border: 2px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.style-card:hover {
  background: white;
  border-color: rgba(37, 99, 235, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
}

.style-card.selected {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
}

.style-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.style-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
}

.style-desc {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}
EOF

echo "✓ 创建风格选择器组件"

# 7. 比例选择器组件
cat > src/components/AspectRatioSelector.jsx << 'EOF'
import './AspectRatioSelector.css'

const ASPECT_RATIOS = [
  { id: 'mobile', ratio: '9:16', name: '手机海报', desc: '微信朋友圈', icon: '📱' },
  { id: 'wechat_cover', ratio: '16:9', name: '横版封面', desc: '公众号封面', icon: '🖼️' },
  { id: 'weibo', ratio: '1:1', name: '正方形', desc: '微博海报', icon: '⬜' },
  { id: 'a4', ratio: '3:4', name: 'A4 打印', desc: '打印张贴', icon: '📄' },
]

export default function AspectRatioSelector({ value, onChange }) {
  return (
    <div className="aspect-ratio-selector">
      <label className="selector-label">
        <span className="label-icon">📐</span>
        <span>选择比例</span>
      </label>
      
      <div className="ratio-options">
        {ASPECT_RATIOS.map(option => (
          <button
            key={option.id}
            className={`ratio-card ${value === option.id ? 'active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <div className="ratio-icon">{option.icon}</div>
            <div className="ratio-value">{option.ratio}</div>
            <div className="ratio-name">{option.name}</div>
            <div className="ratio-desc">{option.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
EOF

# 8. 比例选择器样式
cat > src/components/AspectRatioSelector.css << 'EOF'
.aspect-ratio-selector {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  margin-bottom: 1.5rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.label-icon {
  font-size: 1.25rem;
}

.ratio-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.ratio-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  background: rgba(248, 250, 255, 0.5);
  border: 2px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ratio-card:hover {
  background: white;
  border-color: rgba(37, 99, 235, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
}

.ratio-card.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
}

.ratio-icon {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.ratio-value {
  font-weight: 700;
  color: #2563eb;
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.ratio-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.ratio-desc {
  font-size: 0.75rem;
  color: #64748b;
}
EOF

echo "✓ 创建比例选择器组件"

# 9. 模板库组件
cat > src/components/TemplateLibrary.jsx << 'EOF'
import './TemplateLibrary.css'

const TEMPLATES = [
  {
    id: 'training-1',
    category: '培训海报',
    name: '专业培训',
    prompt: '高质量，专业设计，培训主题，现代办公室环境，简约风格，明亮均匀照明，三分法构图，专业蓝色调',
  },
  {
    id: 'culture-1',
    category: '文化海报',
    name: '团队建设',
    prompt: '高质量，活力四射，文化活动，温暖自然光，侧光营造层次感，色彩鲜艳，橙色红色系',
  },
  {
    id: 'brand-1',
    category: '品牌宣传',
    name: '高端商务',
    prompt: '高质量，高端商务风格，品牌宣传，专业影棚布光，主光 + 补光，品牌主色 + 中性色，哑光质感',
  },
  {
    id: 'festival-1',
    category: '节日海报',
    name: '节日喜庆',
    prompt: '高质量，节日氛围，喜庆热闹，节日灯光，暖色调聚光灯，红色金色配色，丝绸质感',
  },
  {
    id: 'notice-1',
    category: '通知海报',
    name: '清晰醒目',
    prompt: '高质量，清晰醒目，通知海报，均匀平面照明，蓝色白色配色，干净平面材质',
  },
  {
    id: 'tech-1',
    category: '科技风格',
    name: '未来科技',
    prompt: '高质量，科技感，蓝色渐变背景，未来感线条，抽象几何图形，赛博朋克风格，霓虹灯光',
  },
]

export default function TemplateLibrary({ onSelect }) {
  return (
    <div className="template-library">
      <label className="selector-label">
        <span className="label-icon">📝</span>
        <span>提示词模板</span>
      </label>
      
      <div className="template-grid">
        {TEMPLATES.map(template => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => onSelect(template)}
          >
            <div className="template-category">{template.category}</div>
            <div className="template-name">{template.name}</div>
            <div className="template-prompt">{template.prompt.slice(0, 60)}...</div>
          </div>
        ))}
      </div>
    </div>
  )
}
EOF

# 10. 模板库样式
cat > src/components/TemplateLibrary.css << 'EOF'
.template-library {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  margin-bottom: 1.5rem;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.label-icon {
  font-size: 1.25rem;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.template-card {
  padding: 1.25rem;
  background: rgba(248, 250, 255, 0.5);
  border: 2px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-card:hover {
  background: white;
  border-color: rgba(37, 99, 235, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
}

.template-category {
  font-size: 0.75rem;
  color: #2563eb;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.template-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.template-prompt {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}
EOF

echo "✓ 创建模板库组件"

echo ""
echo "=========================================="
echo "组件文件创建完成"
echo "=========================================="
echo ""

# 更新 App.jsx 主文件
echo "【步骤 3】更新 App.jsx 主文件..."

# 读取当前 App.jsx 并更新
cat > src/App.jsx.new << 'APPEOF'
import { useEffect, useState } from 'react'
import { POSTER_API_URL } from './config'
import Navbar from './components/Navbar'
import PromptInput from './components/PromptInput'
import StyleSelector from './components/StyleSelector'
import AspectRatioSelector from './components/AspectRatioSelector'
import TemplateLibrary from './components/TemplateLibrary'

const ONE_MB = 1024 * 1024
const MIN_BASE64_IMAGE_LENGTH = 64
const BASE64_IMAGE_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/

// 扩展的负面提示词（对标即梦最佳实践）
const DEFAULT_NEGATIVE_PROMPT = '文字、数字、水印、签名、尺寸标注、日期、时间、版本号、模糊、低质量、变形、杂乱、过曝、欠曝、噪点、畸形、多余手指、错误解剖、重复元素、低分辨率、压缩痕迹、色带、锯齿边缘'

const STYLE_MAP = {
  realistic: '写实摄影风格',
  anime: '二次元动漫风格',
  '3d': '3D 渲染风格',
  oil: '油画风格',
  watercolor: '水彩画风格',
  cyberpunk: '赛博朋克风格',
  minimal: '极简现代风格',
  vintage: '复古怀旧风格',
}

const normalizeImageSrc = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''
  if (normalized.startsWith('data:image/') || normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('blob:') || normalized.startsWith('/')) {
    return normalized
  }
  const compactValue = normalized.replace(/^base64,/, '').replace(/\s+/g, '')
  if (compactValue.length >= MIN_BASE64_IMAGE_LENGTH && BASE64_IMAGE_PATTERN.test(compactValue)) {
    return `data:image/png;base64,${compactValue}`
  }
  return ''
}

function App() {
  const [posterType, setPosterType] = useState('training')
  const [sizeTemplate, setSizeTemplate] = useState('mobile')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [style, setStyle] = useState('minimal')
  const [customPrompt, setCustomPrompt] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [referenceFile, setReferenceFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [error, setError] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const handleUseTemplate = (template) => {
    setCustomPrompt(template.prompt)
    setShowTemplates(false)
  }

  const handleOptimizePrompt = async () => {
    // TODO: 调用 AI 优化提示词
    alert('提示词优化功能开发中...')
  }

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      const formData = new FormData()
      formData.append('posterType', posterType)
      formData.append('sizeTemplate', sizeTemplate)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      
      // 将风格选择映射为风格描述
      const styleDesc = STYLE_MAP[style] || '简约现代'
      formData.append('styleDesc', styleDesc)
      
      // 使用优化后的 prompt
      const finalPrompt = customPrompt || `${styleDesc}风格，${title || '海报设计'}，${subtitle || ''}`.trim()
      formData.append('customPrompt', finalPrompt)
      formData.append('negativePrompt', DEFAULT_NEGATIVE_PROMPT)

      if (logoFile) {
        const logoData = await readFileAsBase64(logoFile)
        formData.append('logoImage', logoData)
      }

      if (referenceFile) {
        const refData = await readFileAsBase64(referenceFile)
        formData.append('referenceImage', refData)
      }

      const response = await fetch(POSTER_API_URL, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `生成失败：${response.status}`)
      }

      const data = await response.json()
      
      if (!data.imageUrl && !data.base64Image) {
        throw new Error('未返回图片数据')
      }

      const imageUrl = data.imageUrl || `data:image/png;base64,${data.base64Image}`
      const normalizedUrl = normalizeImageSrc(imageUrl)
      
      if (!normalizedUrl) {
        throw new Error('图片格式不正确')
      }

      setGeneratedImage(normalizedUrl)
    } catch (err) {
      console.error('生成失败:', err)
      setError(err.message || '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDownload = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `poster-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app">
      <Navbar />
      
      <main className="main-content">
        <div className="container">
          {/* 标题区 */}
          <section className="hero-section">
            <h1 className="hero-title">
              <span className="title-icon">🎨</span>
              AI 海报生成器
            </h1>
            <p className="hero-subtitle">
              输入创意描述，选择风格，一键生成专业海报
            </p>
          </section>

          {/* 提示词输入 */}
          <PromptInput
            value={customPrompt}
            onChange={setCustomPrompt}
            onUseTemplate={() => setShowTemplates(!showTemplates)}
            onOptimize={handleOptimizePrompt}
          />

          {/* 模板库（条件显示） */}
          {showTemplates && (
            <TemplateLibrary onSelect={handleUseTemplate} />
          )}

          {/* 风格选择 */}
          <StyleSelector value={style} onChange={setStyle} />

          {/* 比例选择 */}
          <AspectRatioSelector value={sizeTemplate} onChange={setSizeTemplate} />

          {/* 标题和副标题 */}
          <div className="form-section">
            <label className="form-label">海报标题</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入海报标题（可选）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="form-label">副标题</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入副标题（可选）"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>

          {/* 素材上传 */}
          <div className="form-section">
            <label className="form-label">🏷️ Logo 文件</label>
            <input
              type="file"
              className="file-input"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files[0])}
            />
            {logoFile && <div className="file-name">已选择：{logoFile.name}</div>}
          </div>

          <div className="form-section">
            <label className="form-label">🖼️ 参考图</label>
            <input
              type="file"
              className="file-input"
              accept="image/*"
              onChange={(e) => setReferenceFile(e.target.files[0])}
            />
            {referenceFile && <div className="file-name">已选择：{referenceFile.name}</div>}
          </div>

          {/* 生成按钮 */}
          <button
            className="btn-generate"
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
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 生成结果 */}
          {generatedImage && (
            <div className="result-section">
              <h2 className="result-title">生成结果</h2>
              <div className="result-image-container">
                <img src={generatedImage} alt="生成的海报" className="result-image" />
              </div>
              <button className="btn-download" onClick={handleDownload}>
                <span className="btn-icon">⬇️</span>
                <span>下载图片</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
APPEOF

mv src/App.jsx.new src/App.jsx
echo "✓ App.jsx 更新完成"
echo ""

# 更新全局样式
echo "【步骤 4】更新全局样式..."

cat >> src/index.css << 'CSSEOF'

/* ========== P0 改版新增样式 ========== */

.app {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f9ff 0%, #eef3ff 100%);
}

.main-content {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero 区域 */
.hero-section {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 2rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.title-icon {
  font-size: 3.5rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  font-weight: 500;
}

/* 表单区域 */
.form-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: rgba(248, 250, 255, 0.5);
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  background: white;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.file-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-input:hover {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.05);
}

.file-name {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #2563eb;
  font-weight: 500;
}

/* 生成按钮 */
.btn-generate {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.4);
}

.btn-generate:disabled {
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

/* 错误提示 */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: #dc2626;
  font-weight: 500;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-icon {
  font-size: 1.25rem;
}

/* 结果区域 */
.result-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.15);
  text-align: center;
}

.result-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.result-image-container {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.result-image {
  width: 100%;
  height: auto;
  display: block;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .title-icon {
    font-size: 2.5rem;
  }
  
  .container {
    padding: 0 1rem;
  }
  
  .style-grid,
  .ratio-options,
  .template-grid {
    grid-template-columns: 1fr;
  }
}
CSSEOF

echo "✓ 全局样式更新完成"
echo ""

# 验证构建
echo "【步骤 5】验证构建..."
npm run build
echo ""

echo "=========================================="
echo "✅ P0 改版完成！"
echo "=========================================="
echo ""
echo "【新增组件】"
echo "  ✓ Navbar - 顶部导航栏"
echo "  ✓ PromptInput - 提示词输入框"
echo "  ✓ StyleSelector - 风格选择器"
echo "  ✓ AspectRatioSelector - 比例选择器"
echo "  ✓ TemplateLibrary - 提示词模板库"
echo ""
echo "【主要改进】"
echo "  ✓ 统一大文本框提示词输入"
echo "  ✓ 可视化风格选择（8 种风格）"
echo "  ✓ 可视化比例选择（4 种比例）"
echo "  ✓ 提示词模板库（6 个模板）"
echo "  ✓ 扩展负面提示词（对标即梦）"
echo "  ✓ 即梦风格 UI 设计"
echo ""
echo "【下一步】"
echo "  1. 测试前端功能"
echo "  2. 验证生成效果"
echo "  3. 根据反馈优化"
echo ""
echo "请检查并提交："
echo "git add -A"
echo "git commit -m 'feat(P0): 即梦风格 UI 改版 - 优化核心用户体验'"
echo "git push origin main"
