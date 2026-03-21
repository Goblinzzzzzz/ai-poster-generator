const SPACE_PATTERN = /\s+/g
const TRAILING_PUNCTUATION_PATTERN = /[，。；、,.!?！？\s]+$/g
const CLAUSE_SPLIT_PATTERN = /[，。；、,.!?！？\n]+/g
const SCENE_PATTERN = /场景|空间|室内|室外|街道|城市|森林|海边|展厅|窗边|背景|环境|舞台|店内|吧台|自然中/
const LIGHT_PATTERN = /光|逆光|侧光|顶光|补光|晨光|夕阳|夜景|阴影|氛围光|明暗|高光|轮廓光/
const COMPOSITION_PATTERN = /构图|特写|近景|中景|远景|俯拍|仰拍|留白|焦点|主体|居中|对称|视角/
const TEXTURE_PATTERN = /材质|纹理|细节|质感|肌理|玻璃|金属|布料|皮革|液体|颗粒/
const COLOR_PATTERN = /色彩|配色|主色|综合色|色调|冷色|暖色|饱和|低饱和|高饱和|撞色/
const STYLE_PATTERN = /风格|电影感|杂志|海报|插画|写实|极简|高级|品牌感|商业摄影|胶片|复古/
const SELLING_POINT_PATTERN = /卖点|亮点|主打|核心|功能|特点|香气|口感|质地|识别|记忆点/
const MULTI_SUBJECT_PATTERN = /多人|双人|情侣|家庭|群像|组合|多人组|团队|模特群/
const PRODUCT_PATTERN = /产品|海报|饮品|包装|瓶|杯|手机|耳机|服饰|鞋|美妆|护肤|香水|食品|零食/
const PERSON_PATTERN = /人物|女孩|男孩|模特|肖像|人像|女生|男生|情侣|角色|艺人|主播/
const SPACE_SUBJECT_PATTERN = /展厅|建筑|空间|室内|酒店|家居|客厅|店铺|陈列|场馆/

const normalizePromptText = (value) => String(value || '').trim().replace(SPACE_PATTERN, ' ')

const trimTrailingPunctuation = (value) =>
  normalizePromptText(value).replace(TRAILING_PUNCTUATION_PATTERN, '')

const splitPromptClauses = (value) =>
  trimTrailingPunctuation(value)
    .split(CLAUSE_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean)

const dedupeClauses = (clauses) => {
  const seen = new Set()

  return clauses.filter((clause) => {
    const key = clause.toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const joinPromptSegments = (segments) => {
  const normalizedSegments = segments
    .map((item) => trimTrailingPunctuation(item))
    .filter(Boolean)

  if (!normalizedSegments.length) {
    return ''
  }

  return `${normalizedSegments.join('，')}。`
}

const formatLabeledLines = (entries) =>
  entries
    .map(({ label, text }) => `${label}：${trimTrailingPunctuation(text)}`)
    .filter((item) => !item.endsWith('：'))
    .join('\n')

const buildExcerpt = (value, limit = 28) => {
  const normalized = trimTrailingPunctuation(value)

  if (!normalized) {
    return ''
  }

  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized
}

const extractSubjectAnchor = (prompt) => {
  const clauses = dedupeClauses(splitPromptClauses(prompt))

  if (!clauses.length) {
    return ''
  }

  return clauses[0]
}

const inferStyleDirection = (prompt) =>
  STYLE_PATTERN.test(prompt)
    ? '沿用原有风格关键词，并统一为连贯的品牌海报语气'
    : '统一为高质感、简洁清楚、不过度堆词的品牌海报表达'

const inferReferenceDirection = (prompt) => {
  if (PRODUCT_PATTERN.test(prompt)) {
    return '优先参考品牌 KV、商业产品广告或高级静物摄影'
  }

  if (PERSON_PATTERN.test(prompt)) {
    return '优先参考杂志封面、情绪人像或时尚大片'
  }

  if (SPACE_SUBJECT_PATTERN.test(prompt)) {
    return '优先参考空间摄影、建筑视觉或情绪场景图'
  }

  return '优先参考商业海报、电影感剧照或统一风格的视觉案例'
}

const inferCompositionLine = (orientation, hasReferenceMeta) => {
  if (orientation === 'portrait') {
    return hasReferenceMeta
      ? '构图倾向沿用竖向聚焦，上下拉开纵深，主体尽量落在中轴或三分线焦点位'
      : '优先寻找竖向聚焦的参考图，让主体上收、背景下沉，方便海报排版留白'
  }

  if (orientation === 'landscape') {
    return hasReferenceMeta
      ? '构图倾向沿用横向铺陈，主体明确占据视觉重心，背景用于承接氛围与节奏'
      : '优先寻找横向展开的参考图，让主体和环境形成清楚的前后层次'
  }

  return hasReferenceMeta
    ? '构图倾向以中心或对称式稳定聚焦，确保主体识别一眼成立'
    : '优先寻找主体明确、中心聚焦稳定的参考图，避免视线游移'
}

const inferSubjectRelationLine = (prompt, hasReferenceMeta) => {
  if (MULTI_SUBJECT_PATTERN.test(prompt)) {
    return hasReferenceMeta
      ? '主体关系保持多人同框但有主次，前后站位和视线关系要清楚'
      : '参考图里优先选择多人关系明确的画面，避免人物平均铺开没有重点'
  }

  return hasReferenceMeta
    ? '主体关系以单主体突出为主，背景元素退居辅助层，不抢主视觉'
    : '参考图里优先选择单主体清楚、背景不抢戏的画面，让第一眼焦点稳定落在主体上'
}

const inferToneLine = (prompt, hasReferenceMeta) => {
  if (COLOR_PATTERN.test(prompt)) {
    return hasReferenceMeta
      ? '色调与气质优先继承参考图已有的配色节奏、明暗对比和整体氛围'
      : '参考图尽量选择与当前描述配色一致的案例，保持主色、明暗和气质统一'
  }

  return hasReferenceMeta
    ? '色调与气质延续参考图的综合色调，优先选择干净统一、情绪明确的视觉氛围'
    : '参考图尽量选择综合色调统一、气质明确的案例，不要混入多个互相冲突的风格'
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

  const sceneLine = SCENE_PATTERN.test(normalizedPrompt)
    ? '场景延续原有设定，并补足前景、中景、背景层次，让空间关系更完整'
    : '场景补入真实可感的环境承托，建立前景、中景、背景层次，避免主体悬空'
  const lightLine = LIGHT_PATTERN.test(normalizedPrompt)
    ? '光线沿用原有设定，同时明确主光源方向、轮廓光和环境补光关系'
    : '光线采用明确主光源配合柔和环境补光，形成稳定体积感、氛围感和边缘层次'
  const compositionLine = COMPOSITION_PATTERN.test(normalizedPrompt)
    ? '构图保持原有视角，但进一步收束视觉焦点，明确主体重心与留白位置'
    : '构图以主体聚焦为核心，重心稳定，前后景有区分，并预留海报标题与卖点留白'
  const textureLine = TEXTURE_PATTERN.test(normalizedPrompt)
    ? '材质继续强化真实纹理与边缘细节，避免表面过平或质感模糊'
    : '材质表现强调真实纹理、边缘清晰和细节可辨，让画面更像可交付成片'
  const colorLine = COLOR_PATTERN.test(normalizedPrompt)
    ? '色彩沿用原有主辅色关系，并统一整体色调、饱和度和视觉节奏'
    : '色彩以一组主色控制整体氛围，辅以少量强调色提亮重点，避免颜色发散'

  const nextPrompt = joinPromptSegments([
    normalizedPrompt,
    sceneLine,
    lightLine,
    compositionLine,
    textureLine,
    colorLine,
    '整体信息完整、层次清楚，可直接用于生成高质感海报画面',
  ])

  return {
    ok: true,
    mode: 'replace',
    title: '场景强化已回填',
    summary: '已按场景、光线、构图、材质、色彩五个维度补强成更稳定的生成提示词。',
    generatedText: formatLabeledLines([
      { label: '场景', text: sceneLine },
      { label: '光线', text: lightLine },
      { label: '构图', text: compositionLine },
      { label: '材质', text: textureLine },
      { label: '色彩', text: colorLine },
    ]),
    prompt: nextPrompt,
  }
}

export const buildReferenceIdea = ({ prompt, referenceMeta }) => {
  const normalizedPrompt = normalizePromptText(prompt)
  const subjectAnchor = buildExcerpt(extractSubjectAnchor(normalizedPrompt) || '当前主体')
  const hasReferenceMeta = Boolean(referenceMeta)
  const compositionLine = inferCompositionLine(referenceMeta?.orientation, hasReferenceMeta)
  const relationLine = inferSubjectRelationLine(normalizedPrompt, hasReferenceMeta)
  const toneLine = inferToneLine(normalizedPrompt, hasReferenceMeta)
  const referenceDirectionLine = hasReferenceMeta
    ? `${inferReferenceDirection(normalizedPrompt)}，并把主体表达稳定收束在“${subjectAnchor}”附近`
    : `${inferReferenceDirection(normalizedPrompt)}，优先选择主体清楚、背景简洁、光线明确的同类案例`

  const ratioLine =
    hasReferenceMeta && referenceMeta.width && referenceMeta.height
      ? `参考比例接近 ${referenceMeta.width}:${referenceMeta.height} 的${referenceMeta.orientationLabel}`
      : hasReferenceMeta
        ? `参考方向以${referenceMeta.orientationLabel}为主`
        : '暂未上传参考图，可先按以下方向补充参考要求'
  const appendPrompt = joinPromptSegments([
    hasReferenceMeta ? '参考图执行思路' : '参考图方向建议',
    ratioLine,
    compositionLine,
    relationLine,
    toneLine,
    referenceDirectionLine,
  ])

  return {
    ok: true,
    mode: 'append',
    title: hasReferenceMeta ? '参考图思路已追加' : '参考图方向建议已追加',
    summary: hasReferenceMeta
      ? '已根据参考图补充构图倾向、主体关系、色调气质和参考方向。'
      : '未上传参考图，已生成可直接追加到提示词里的明确参考方向要求。',
    generatedText: formatLabeledLines([
      { label: '比例/方向', text: ratioLine },
      { label: '构图倾向', text: compositionLine },
      { label: '主体关系', text: relationLine },
      { label: '色调/气质', text: toneLine },
      { label: '参考方向', text: referenceDirectionLine },
    ]),
    prompt: appendPrompt,
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

  const clauses = dedupeClauses(splitPromptClauses(normalizedPrompt))
  const leadClause = clauses[0] || normalizedPrompt
  const supportingClauses = clauses.slice(1, 3)
  const sellingPointLine = SELLING_POINT_PATTERN.test(normalizedPrompt)
    ? '保留原有卖点信息，并把最重要的记忆点集中到主体描述附近'
    : '补足主体识别度、核心卖点和第一眼记忆点，让重点更集中'
  const languageLine =
    clauses.length > 2
      ? '删去重复、空泛和跳跃的修饰，把信息整理成自然、连贯、好理解的生成表达'
      : '在不堆砌形容词的前提下，把语句整理得更自然、更顺口、更适合生成'
  const styleLine = inferStyleDirection(normalizedPrompt)
  const structureLine = supportingClauses.length
    ? `保留“${supportingClauses.join('、')}”这些有效信息，但整体语序更清楚、重点更靠前`
    : '补足必要的风格和卖点描述，但不让句子变得松散冗长'

  const nextPrompt = joinPromptSegments([
    leadClause,
    ...supportingClauses,
    sellingPointLine,
    structureLine,
    styleLine,
    languageLine,
  ])

  return {
    ok: true,
    mode: 'replace',
    title: '文案优化已回填',
    summary: '已改成更自然、更聚焦卖点、更统一风格的生成表达。',
    generatedText: formatLabeledLines([
      { label: '主体与卖点', text: sellingPointLine },
      { label: '结构整理', text: structureLine },
      { label: '风格统一', text: styleLine },
      { label: '语言表达', text: languageLine },
    ]),
    prompt: nextPrompt,
  }
}
