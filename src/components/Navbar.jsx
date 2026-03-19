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
