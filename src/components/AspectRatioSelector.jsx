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
