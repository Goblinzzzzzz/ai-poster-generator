const workflows = [
  "Prompt-to-poster concept in one pass",
  "Brand-safe layouts with style presets",
  "Export-ready artboards for social and print",
];

const promptIdeas = [
  "Launch poster for a midnight ramen pop-up",
  "A sportswear campaign with kinetic typography",
  "Editorial movie poster for an AI thriller release",
];

const footerLinks = [
  { label: "Product", href: "#studio" },
  { label: "Templates", href: "#workflow" },
  { label: "Roadmap", href: "#studio" },
  { label: "Support", href: "#footer" },
];

function App() {
  return (
    <div className="relative isolate min-h-screen bg-[var(--color-ink)] text-[var(--color-paper)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(255,140,66,0.28),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.22),_transparent_28%),linear-gradient(180deg,_#12131a_0%,_#171923_55%,_#0d0e13_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[linear-gradient(135deg,_rgba(243,241,232,0.08),_transparent_32%)]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="panel flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">Creative tooling</p>
            <a href="/" className="mt-2 inline-flex items-center gap-3 text-xl font-semibold tracking-[0.18em] uppercase">
              <span className="logo-mark">AP</span>
              AI Poster Generator
            </a>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
            <a className="nav-link" href="#studio">
              Studio
            </a>
            <a className="nav-link" href="#workflow">
              Workflow
            </a>
            <a className="nav-link" href="#footer">
              Contact
            </a>
            <a className="cta-button" href="#studio">
              Start concepting
            </a>
          </nav>
        </header>

        <main className="flex-1 py-8 sm:py-10">
          <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="panel p-6 sm:p-8">
                <p className="eyebrow">Prompt. Compose. Publish.</p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-[0.9] tracking-[-0.04em] sm:text-6xl">
                  Generate bold campaign posters from a single creative brief.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--color-muted)] sm:text-lg">
                  Turn a mood, product launch, or event concept into polished visual directions with AI-assisted layouts,
                  color systems, and export-ready poster variants.
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
                  <h2>Set the story</h2>
                  <p>Define the headline, audience, mood, and format in a compact prompt.</p>
                </article>
                <article className="info-card">
                  <span className="step-index">02</span>
                  <h2>Dial the style</h2>
                  <p>Choose from editorial, festival, tech launch, or cinematic visual systems.</p>
                </article>
                <article className="info-card">
                  <span className="step-index">03</span>
                  <h2>Ship the layout</h2>
                  <p>Review poster directions, refine copy, and export assets for the campaign.</p>
                </article>
              </div>
            </div>

            <section id="studio" className="panel overflow-hidden p-0">
              <div className="grid lg:grid-cols-[0.98fr_1.02fr]">
                <div className="border-b border-white/10 p-6 sm:p-8 lg:border-r lg:border-b-0">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow">Prompt studio</p>
                    <span className="status-pill">Draft mode</span>
                  </div>

                  <div className="mt-6 space-y-5">
                    <label className="field-group">
                      <span>Creative brief</span>
                      <textarea
                        className="input-shell min-h-32 resize-none"
                        defaultValue="Design a premium poster for a rooftop jazz night in Shanghai. Use warm copper lighting, condensed typography, and a cinematic city backdrop."
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="field-group">
                        <span>Style system</span>
                        <select className="input-shell">
                          <option>Editorial Neon</option>
                          <option>Cinematic Minimal</option>
                          <option>Festival Grit</option>
                          <option>Luxury Product</option>
                        </select>
                      </label>

                      <label className="field-group">
                        <span>Output ratio</span>
                        <select className="input-shell">
                          <option>4:5 portrait</option>
                          <option>1:1 square</option>
                          <option>16:9 widescreen</option>
                          <option>A3 print</option>
                        </select>
                      </label>
                    </div>

                    <div>
                      <p className="mb-2 text-sm uppercase tracking-[0.24em] text-[var(--color-muted)]">Quick prompts</p>
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
                        Generate poster
                      </button>
                      <button type="button" className="secondary-button">
                        Save concept
                      </button>
                    </div>
                  </div>
                </div>

                <div className="relative bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] p-6 sm:p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_34%)]" />
                  <div className="relative flex h-full flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <p className="eyebrow">Live preview</p>
                      <span className="text-sm text-[var(--color-muted)]">Variant A / Hero poster</span>
                    </div>

                    <div className="poster-frame">
                      <div className="poster-card">
                        <p className="poster-kicker">Shanghai Rooftop Sessions</p>
                        <div>
                          <h2 className="poster-title">MIDNIGHT JAZZ</h2>
                          <p className="poster-copy">Copper lights. Skyline haze. One-night live set.</p>
                        </div>
                        <div className="poster-meta">
                          <span>April 26</span>
                          <span>21:00</span>
                          <span>The Glass Terrace</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="mini-card">
                        <span>Palette</span>
                        <strong>Copper / Ink / Ivory</strong>
                      </div>
                      <div className="mini-card">
                        <span>Type</span>
                        <strong>Condensed + Serif</strong>
                      </div>
                      <div className="mini-card">
                        <span>Output</span>
                        <strong>Social + Print</strong>
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
            <p className="text-[var(--color-paper)]">AI Poster Generator</p>
            <p>React 18, Vite, Tailwind CSS v4, Railway-ready static deployment.</p>
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
