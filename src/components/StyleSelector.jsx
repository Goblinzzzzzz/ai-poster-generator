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
