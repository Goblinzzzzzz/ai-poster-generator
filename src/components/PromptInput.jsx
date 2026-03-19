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
