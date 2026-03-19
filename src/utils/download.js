const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sanitizeFileName = (value) =>
  String(value || 'poster')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 48) || 'poster'

const buildPalette = (seed = '') => {
  const value = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0)
  const hue = value % 360

  return {
    start: `hsl(${hue} 88% 96%)`,
    end: `hsl(${(hue + 48) % 360} 72% 84%)`,
    accent: `hsl(${(hue + 20) % 360} 68% 42%)`,
  }
}

const buildPlaceholderSvg = (work) => {
  const palette = buildPalette(`${work.id}${work.headline}${work.author}`)
  const headline = escapeXml(work.headline || '作品预览')
  const tone = escapeXml(work.tone || work.prompt || '')
  const badge = escapeXml(work.mediaType || '图像')
  const avatar = escapeXml(work.avatar || 'AI')

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" role="img" aria-label="${headline}">
      <defs>
        <linearGradient id="surface" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.start}" />
          <stop offset="100%" stop-color="${palette.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1500" rx="84" fill="url(#surface)" />
      <rect x="88" y="88" width="206" height="64" rx="32" fill="rgba(255,255,255,0.72)" />
      <text x="132" y="130" fill="rgba(15,23,42,0.72)" font-size="32" font-family="Manrope, PingFang SC, sans-serif">${badge}</text>
      <circle cx="144" cy="1280" r="54" fill="rgba(255,255,255,0.66)" />
      <text x="144" y="1292" text-anchor="middle" fill="${palette.accent}" font-size="28" font-weight="700" font-family="Manrope, PingFang SC, sans-serif">${avatar}</text>
      <text x="88" y="1138" fill="#0f172a" font-size="96" font-weight="700" font-family="Manrope, PingFang SC, sans-serif">${headline}</text>
      <text x="88" y="1228" fill="rgba(15,23,42,0.64)" font-size="38" font-family="Manrope, PingFang SC, sans-serif">${tone}</text>
    </svg>
  `
}

const svgToDataUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

const triggerDownload = (href, fileName) => {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

export const getWorkPreviewSrc = (work) => {
  if (work?.imageSrc) {
    return work.imageSrc
  }

  return svgToDataUrl(buildPlaceholderSvg(work || {}))
}

export const getWorkDownloadName = (work) => {
  const baseName = sanitizeFileName(work?.headline || work?.prompt || 'poster')
  return `${baseName}.png`
}

export const downloadWorkImage = async (work) => {
  const source = getWorkPreviewSrc(work)
  const fileName = getWorkDownloadName(work)

  if (source.startsWith('data:') || source.startsWith('blob:')) {
    triggerDownload(source, fileName)
    return
  }

  try {
    const response = await fetch(source)

    if (!response.ok) {
      throw new Error(`图片请求失败（${response.status}）`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerDownload(objectUrl, fileName)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  } catch {
    triggerDownload(source, fileName)
  }
}

export const shareWork = async (work) => {
  const title = work?.headline || '作品分享'
  const text = [title, work?.prompt].filter(Boolean).join('\n')
  const source = getWorkPreviewSrc(work)
  const shareUrl = source.startsWith('http') ? source : undefined

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      })
      return
    } catch (error) {
      if (error?.name === 'AbortError') {
        return
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText([text, shareUrl].filter(Boolean).join('\n'))
    return
  }

  throw new Error('当前环境不支持分享。')
}
