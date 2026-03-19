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
