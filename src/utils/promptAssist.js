const SPACE_PATTERN = /\s+/g
const TRAILING_PUNCTUATION_PATTERN = /[，。；、,.!?！？\s]+$/g
const SCENE_PATTERN = /场景|空间|室内|室外|街道|城市|森林|海边|展厅|窗边|背景|环境/
const LIGHT_PATTERN = /光|逆光|侧光|顶光|补光|晨光|夕阳|夜景|阴影|氛围光/
const COMPOSITION_PATTERN = /构图|特写|近景|中景|远景|俯拍|仰拍|留白|焦点|主体/
const TEXTURE_PATTERN = /材质|纹理|细节|质感|肌理|色彩|配色/
const STYLE_PATTERN = /风格|电影感|杂志|海报|插画|写实|极简|高级/

const normalizePromptText = (value) => String(value || '').trim().replace(SPACE_PATTERN, ' ')

const trimTrailingPunctuation = (value) =>
  normalizePromptText(value).replace(TRAILING_PUNCTUATION_PATTERN, '')

const mergePrompt = (basePrompt, additions) => {
  const normalizedBase = trimTrailingPunctuation(basePrompt)
  const normalizedAdditions = additions
    .map((item) => trimTrailingPunctuation(item))
    .filter(Boolean)

  if (!normalizedBase) {
    return `${normalizedAdditions.join('，')}。`
  }

  if (!normalizedAdditions.length) {
    return `${normalizedBase}。`
  }

  return `${normalizedBase}，${normalizedAdditions.join('，')}。`
}

const buildExcerpt = (value, limit = 24) => {
  const normalized = trimTrailingPunctuation(value)

  if (!normalized) {
    return ''
  }

  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized
}

export const enhanceScenePrompt = (prompt) => {
  const normalizedPrompt = normalizePromptText(prompt)

  if (!normalizedPrompt) {
    return {
      ok: false,
      title: '缺少创作描述',
      summary: '先输入当前创意，再进行场景强化。',
    }
  }

  const additions = []

  if (!SCENE_PATTERN.test(normalizedPrompt)) {
    additions.push('置于具备前景、中景、背景层次的真实场景中')
  }

  if (!LIGHT_PATTERN.test(normalizedPrompt)) {
    additions.push('使用明确主光源与柔和环境补光，强化空间氛围')
  }

  if (!COMPOSITION_PATTERN.test(normalizedPrompt)) {
    additions.push('主体保持清晰视觉焦点，并预留海报排版留白')
  }

  if (!TEXTURE_PATTERN.test(normalizedPrompt)) {
    additions.push('材质纹理真实细腻，色彩关系克制统一')
  }

  if (!additions.length) {
    additions.push('进一步强化场景叙事、空间纵深与光影层次')
  }

  return {
    ok: true,
    mode: 'replace',
    title: '场景强化已回填',
    summary: '已补充场景、光线和构图描述。',
    generatedText: additions.join('，'),
    prompt: mergePrompt(normalizedPrompt, additions),
  }
}

export const buildReferenceIdea = ({ prompt, referenceMeta }) => {
  if (!referenceMeta) {
    return {
      ok: false,
      title: '请先上传参考图',
      summary: '添加参考图后，才能生成参考图方向补充。',
    }
  }

  const normalizedPrompt = normalizePromptText(prompt)
  const subjectExcerpt = buildExcerpt(normalizedPrompt)
  const directionHints = []

  if (referenceMeta.orientation === 'portrait') {
    directionHints.push('沿用参考图的竖向构图，拉开主体与背景的纵深层次')
  } else if (referenceMeta.orientation === 'landscape') {
    directionHints.push('沿用参考图的横向铺陈方式，强化画面延展与节奏')
  } else {
    directionHints.push('沿用参考图的中心式平衡构图，保持主体稳定聚焦')
  }

  directionHints.push('优先继承参考图的配色节奏、明暗关系与整体气质')

  if (subjectExcerpt) {
    directionHints.push(`围绕“${subjectExcerpt}”保持主体设定稳定，不偏离核心卖点`)
  } else {
    directionHints.push('补充主体、卖点与画面焦点，避免参考图方向过于空泛')
  }

  directionHints.push('将背景元素压缩到辅助层，避免干扰主体识别')

  if (referenceMeta.width && referenceMeta.height) {
    directionHints.unshift(
      `参考图比例接近 ${referenceMeta.width}:${referenceMeta.height} 的${referenceMeta.orientationLabel}`,
    )
  }

  return {
    ok: true,
    mode: 'append',
    title: '参考图方向已生成',
    summary: '已追加参考图方向补充，可继续微调。',
    generatedText: `参考图方向补充：${directionHints.join('，')}。`,
  }
}

export const optimizePromptCopy = (prompt) => {
  const normalizedPrompt = normalizePromptText(prompt)

  if (!normalizedPrompt) {
    return {
      ok: false,
      title: '缺少创作描述',
      summary: '先输入当前文案，再进行优化。',
    }
  }

  const additions = ['突出主体识别度与核心卖点']

  if (!STYLE_PATTERN.test(normalizedPrompt)) {
    additions.push('画面风格统一，保持高质感海报表达')
  }

  if (!LIGHT_PATTERN.test(normalizedPrompt)) {
    additions.push('光线组织清晰，保留氛围感与体积感')
  }

  if (!COMPOSITION_PATTERN.test(normalizedPrompt)) {
    additions.push('构图简洁稳定，主体突出且留白明确')
  }

  if (!TEXTURE_PATTERN.test(normalizedPrompt)) {
    additions.push('材质细节清楚，色彩干净不堆砌')
  }

  return {
    ok: true,
    mode: 'replace',
    title: '文案优化已回填',
    summary: '已整理成更适合生成的提示词表达。',
    generatedText: additions.join('，'),
    prompt: mergePrompt(normalizedPrompt, additions),
  }
}
