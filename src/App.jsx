const workflows = [
  "一键从提示生成海报概念",
  "通过风格预设生成品牌安全版式",
  "可直接导出的社交与印刷画板",
];

const promptIdeas = [
  "深夜拉面快闪店开业海报",
  "带有动态字体的运动服饰宣传海报",
  "AI 惊悚片上映的杂志风电影海报",
];

const footerLinks = [
  { label: "产品", href: "#studio" },
  { label: "模板", href: "#workflow" },
  { label: "路线图", href: "#studio" },
  { label: "支持", href: "#footer" },
];

function App() {
  return (
    <div className="relative isolate min-h-screen bg-[var(--color-ink)] text-[var(--color-paper)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(255,140,66,0.28),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_28%),linear-gradient(180deg,_#12131a_0%,_#171923_55%,_#0d0e13_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[linear-gradient(135deg,_rgba(243,241,232,0.08),_transparent_32%)]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="panel flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">创意工具</p>
            <a href="/" className="mt-2 inline-flex items-center gap-3 text-xl font-semibold tracking-[0.18em] uppercase">
              <span className="logo-mark">AP</span>
              AI 海报生成器
            </a>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
            <a className="nav-link" href="#studio">
              创作台
            </a>
            <a className="nav-link" href="#workflow">
              流程
            </a>
            <a className="nav-link" href="#footer">
              联系
            </a>
            <a className="cta-button" href="#studio">
              开始构思
            </a>
          </nav>
        </header>

        <main className="flex-1 py-8 sm:py-10">
          <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="panel p-6 sm:p-8">
                <p className="eyebrow">输入提示。完成设计。立即发布。</p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-[0.9] tracking-[-0.04em] sm:text-6xl">
                  只需一份创意简报，即可生成大胆吸睛的宣传海报。
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)] sm:text-lg">
                  将情绪主题、产品发布或活动概念转化为成熟的视觉方向，借助 AI 辅助版式、配色系统与可导出的海报方案。
                </p>

                <div className="grid gap-3 pt-3 sm:grid-cols-3">
                  {workflows.map((item) => (
                    <div key={item} className="metric-card">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div id="workflow" className="grid gap-4 md:grid-cols-3">
                <article className="info-card">
                  <span className="step-index">01</span>
                  <h2>设定故事</h2>
                  <p>用简洁提示定义标题、受众、情绪与版式。</p>
                </article>
                <article className="info-card">
                  <span className="step-index">02</span>
                  <h2>调整风格</h2>
                  <p>从杂志风、节庆风、科技发布或电影感视觉系统中选择。</p>
                </article>
                <article className="info-card">
                  <span className="step-index">03</span>
                  <h2>输出版式</h2>
                  <p>查看海报方向、优化文案，并导出宣传素材。</p>
                </article>
              </div>
            </div>

            <section id="studio" className="panel overflow-hidden p-0">
              <div className="grid lg:grid-cols-[0.98fr_1.02fr]">
                <div className="border-b border-white/10 p-6 sm:p-8 lg:border-r lg:border-b-0">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow">提示创作台</p>
                    <span className="status-pill">草稿模式</span>
                  </div>

                  <div className="mt-6 space-y-5">
                    <label className="field-group">
                      <span>创意简报</span>
                      <textarea
                        className="input-shell min-h-32 resize-none"
                        defaultValue="为上海屋顶爵士之夜设计一张高端海报。使用温暖的铜色灯光、窄体字排版和富有电影感的城市背景。"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-group">
                        <span>风格系统</span>
                        <select className="input-shell">
                          <option>杂志霓虹</option>
                          <option>电影极简</option>
                          <option>节庆粗粝</option>
                          <option>奢华产品</option>
                        </select>
                      </label>

                      <label className="field-group">
                        <span>输出比例</span>
                        <select className="input-shell">
                          <option>4:5 竖版</option>
                          <option>1:1 方形</option>
                          <option>16:9 宽屏</option>
                          <option>A3 印刷</option>
                        </select>
                      </label>
                    </div>

                    <div>
                      <p className="mb-2 text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">快捷提示</p>
                      <div className="flex flex-wrap gap-2">
                        {promptIdeas.map((idea) => (
                          <button key={idea} type="button" className="prompt-chip">
                            {idea}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="cta-button">
                        生成海报
                      </button>
                      <button type="button" className="secondary-button">
                        保存概念
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] p-6 sm:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_34%)]" />
                  <div className="relative flex h-full flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <p className="eyebrow">实时预览</p>
                      <span className="text-sm text-[var(--color-muted)]">方案 A / 主视觉海报</span>
                    </div>

                    <div className="poster-frame">
                      <div className="poster-card">
                        <p className="poster-kicker">上海屋顶现场</p>
                        <div>
                          <h2 className="poster-title">午夜爵士</h2>
                          <p className="poster-copy">铜色灯光，天际薄雾，一夜限定现场演出。</p>
                        </div>
                        <div className="poster-meta">
                          <span>4 月 26 日</span>
                          <span>21:00</span>
                          <span>玻璃露台</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="mini-card">
                        <span>配色</span>
                        <strong>铜色 / 墨黑 / 象牙白</strong>
                      </div>
                      <div className="mini-card">
                        <span>字体</span>
                        <strong>窄体 + 衬线</strong>
                      </div>
                      <div className="mini-card">
                        <span>输出</span>
                        <strong>社交媒体 + 印刷</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </main>

        <footer
          id="footer"
          className="panel mt-4 flex flex-col gap-5 px-5 py-5 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-[var(--color-paper)]">AI 海报生成器</p>
            <p>基于 React 18、Vite、Tailwind CSS v4，支持 Railway 静态部署。</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
