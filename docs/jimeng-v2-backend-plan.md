# JIMENG V2 Backend Plan

## 目标
为“即梦同级创作工作台”补齐底层能力层，避免继续堆纯字符串 prompt，形成可扩展到图片 / 视频 / Agent 的统一结构。

## 核心结论

1. **先补中间语义层，再补 provider 渲染层**  
   先建立 `Intent -> PromptSpec -> ProviderRequest` 中间层，比继续堆 prompt 字符串更关键。

2. **Prompt 优化 MVP 先走规则驱动**  
   第一阶段聚焦：去歧义、主题提取、风格补全、构图补全、光线补全、材质补全；暂不引入重型改写链路。

3. **比例 / 清晰度 / 自动 三者不是同一类参数**  
   - 比例：优先映射为模型原生 size / aspect 参数  
   - 清晰度：做成 `size + detail boost + negative constraints + 可选高分链路` 的复合策略  
   - 自动：不是展示态按钮，而是“仅补全缺失项”的决策开关

4. **参数冲突必须由服务端统一裁决**  
   显式参数永远覆盖自动推断，前端只负责采集与展示。

5. **前端只做状态层，优化与映射必须落服务层**  
   否则后续扩展到视频生成 / Agent 模式会继续重复造轮子。

---

## 推荐实现结构

### 新增模块

```text
utils/
  prompt-engine/
    schema.js
    normalize-intent.js
    build-prompt-spec.js
    render-final-prompt.js
  parameter-mapping.js
```

### 模块职责

#### `utils/prompt-engine/schema.js`
定义结构化对象：
- `Intent`
- `PromptSpec`
- `ProviderRequest`

#### `utils/prompt-engine/normalize-intent.js`
把用户输入归一成结构化意图：
- 主体
- 场景
- 风格
- 构图
- 光线
- 材质
- 镜头
- 动作 / 节奏（为视频预留）

#### `utils/prompt-engine/build-prompt-spec.js`
基于：
- 文本输入
- 参考图信息
- 模式
- 偏好参数
构造统一 `PromptSpec`

#### `utils/prompt-engine/render-final-prompt.js`
把 `PromptSpec` 渲染成 provider 所需最终 prompt 文本

#### `utils/parameter-mapping.js`
统一处理：
- aspect ratio
- clarity
- auto enhance
- sizeTemplate
- referenceImage mapping

---

## Prompt 优化 MVP

### 输入
- 用户原始文本
- 模式（image / video / agent）
- 偏好参数（aspectRatio / clarity / autoEnhance）
- 参考图信息（如有）

### 输出
一个结构化 `PromptSpec`，再渲染为最终 prompt。

### MVP 处理步骤
1. 去歧义
2. 主题提取
3. 风格补全
4. 构图补全
5. 光线补全
6. 材质补全
7. 负向约束补全
8. 输出 provider 可消费的 prompt

### 示例 1
**原始输入**  
`做一个高级护肤品海报`

**优化后 PromptSpec 摘要**  
- 主体：高端护肤产品
- 场景：极简商业摄影台面
- 风格：高端商业海报 / clean beauty
- 构图：中心构图 + 留白
- 光线：柔和晨光 + 玻璃反射
- 材质：玻璃器皿 / 乳白质地

**最终 Prompt**  
高端护肤产品商业海报，玻璃器皿，乳白质地，极简留白，中心构图，柔和晨光，干净冷白配色，品牌级商业摄影质感，清晰细节，无文字无水印。

### 示例 2
**原始输入**  
`猫在窗边，治愈一点`

**最终 Prompt 思路**  
补齐：室内场景、逆光、毛发细节、胶片色彩、静谧情绪。

### 示例 3
**原始输入**  
`做一个适合夏天饮料上新的封面`

**最终 Prompt 思路**  
补齐：饮品主体、冰块与冷凝水、夏日高亮配色、广告封面镜头、品牌感留白。

---

## 参数真实映射

### 1. 比例（aspectRatio）
**前端表达**
- 9:16
- 1:1
- 3:4
- 16:9

**后端映射**
- 映射为模型原生 size / template
- 不写进 prompt 文本

**原则**
- 比例属于硬参数，不属于语义描述

### 2. 清晰度（clarity）
**前端表达**
- auto
- standard
- high

**后端映射建议**
- auto：默认尺寸 + 默认细节
- standard：常规尺寸 + 标准 detail boost
- high：更高尺寸 / 二段增强 / 更强负向约束

**原则**
- 不能只映射成“高清”这个词
- 必须映射成复合策略

### 3. 自动（autoEnhance）
**前端表达**
- 开 / 关

**后端映射建议**
- 开：仅补全缺失项，不覆盖显式输入
- 关：尊重原始输入，只做最小安全和格式处理

**原则**
- 自动不是风格按钮，而是策略开关

---

## 前后端职责边界

### 前端负责
- 采集文本
- 采集参考图
- 采集模式
- 采集偏好参数
- 展示优化后的状态 / 预览入口（后续可做）

### 服务层负责
- 结构化意图归一
- 参数冲突裁决
- Prompt 优化
- Provider 参数映射
- 安全过滤

---

## 建议的第一批实现顺序

### Step 1
先建：
- `utils/parameter-mapping.js`
- `utils/prompt-engine/schema.js`

目标：先把比例 / 清晰度 / 自动 从 UI 状态变成真实后端参数层。

### Step 2
再把现有 `utils/prompt-builder.js` 升级为：
`PromptSpec -> finalPrompt` 流水线。

目标：先让图片生成链路受益，再逐步扩到视频 / Agent。

---

## 风险提示

1. 如果继续沿用字符串拼接 prompt，后续功能会越加越乱。  
2. 如果清晰度/自动只做前端展示，用户会迅速失去信任。  
3. 如果参数裁决不放服务端，后续模式扩展会非常痛苦。  
4. 参考图融合建议第二阶段做，不要阻塞第一阶段结构化参数层上线。
