# Railway 环境变量配置清单

## 必需变量

| 变量名 | 说明 | 示例值 | 获取方式 |
|--------|------|--------|---------|
| `DOUBAO_API_KEY` | 火山引擎 Doubao API 密钥 | `your-api-key-here` | 火山引擎控制台 → API Key 管理 |

## 可选变量（有合理默认值）

| 变量名 | 说明 | 默认值 | 建议配置 |
|--------|------|--------|---------|
| `DOUBAO_MODEL` | Doubao 图像生成模型 | `doubao-seedream-4-0-250828` | 保持默认即可 |
| `DOUBAO_API_ENDPOINT` | API 端点 URL | `https://ark.cn-beijing.volces.com/api/v3/images/generations` | 保持默认即可 |
| `GENERATE_RATE_LIMIT_WINDOW_MS` | 限流时间窗口（毫秒） | `60000` (1 分钟) | 根据需求调整 |
| `GENERATE_RATE_LIMIT_MAX_REQUESTS` | 限流窗口内最大请求数 | `5` | 根据需求调整 |
| `CORS_ORIGIN` | 允许的前端域名 | 允许所有 | 生产环境建议指定域名 |
| `UPLOAD_DIR` | 临时文件存储目录 | `/tmp/ai-poster-generator-uploads` | 保持默认即可 |
| `PORT` | 服务端口 | `3000` | Railway 自动管理，无需配置 |

## 前端变量（构建时使用）

| 变量名 | 说明 | 默认值 | 生产环境配置 |
|--------|------|--------|-------------|
| `VITE_POSTER_API_URL` | 前端调用后端的 URL | `http://localhost:3000/api/generate` | `https://[你的域名].railway.app/api/generate` |
| `VITE_APP_NAME` | 应用名称 | `AI Poster Generator` | 可自定义 |
| `VITE_DEFAULT_STYLE` | 默认海报风格 | `Editorial Neon` | 可自定义 |

## Railway 配置步骤

### 1. 连接仓库
1. 登录 [Railway](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `Goblinzzzzzz/ai-poster-generator` 仓库

### 2. 配置环境变量
1. 进入项目 Dashboard
2. 点击 "Variables" 标签
3. 点击 "Add Variable"
4. 依次添加上述环境变量

**推荐添加顺序：**
1. `DOUBAO_API_KEY`（必需）
2. `VITE_POSTER_API_URL`（生产环境 URL）
3. 其他可选变量（保持默认即可）

### 3. 部署
1. 添加环境变量后，Railway 会自动触发部署
2. 查看 "Deployments" 标签页的构建日志
3. 部署完成后，访问分配的域名

### 4. 验证
访问健康检查接口：
```bash
curl https://[你的域名].railway.app/api/health
```

预期响应：
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uploadDir": "/tmp/ai-poster-generator-uploads",
    "provider": "doubao-seed"
  }
}
```

如果 `provider` 显示 `unconfigured`，说明 `DOUBAO_API_KEY` 未正确配置。

## 环境变量诊断

访问调试接口查看环境变量配置：
```bash
curl https://[你的域名].railway.app/api/debug-env
```

返回包含：
- `.env` 文件加载状态
- 所有环境变量值（脱敏）
- Doubao API Key 配置状态
- API 端点配置状态

## 安全注意事项

- ✅ `DOUBAO_API_KEY` 仅在后端使用，不会暴露给前端
- ✅ Railway 环境变量加密存储
- ✅ 不要将 `.env` 文件提交到 Git（已在 `.gitignore` 中）
- ✅ 生产环境建议配置 `CORS_ORIGIN` 限制跨域访问

## 常见问题

### Q: 部署后健康检查失败？
A: 检查以下几点：
1. 确认 `DOUBAO_API_KEY` 已正确配置
2. 查看 Railway 日志中的启动信息
3. 访问 `/api/debug-env` 检查环境变量是否生效

### Q: 如何获取 Doubao API Key？
A: 
1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 进入 "AI 与大数据" → "Doubao"
3. 创建应用并获取 API Key

### Q: 如何修改限流配置？
A: 在 Railway Variables 中修改：
- `GENERATE_RATE_LIMIT_WINDOW_MS` - 时间窗口（毫秒）
- `GENERATE_RATE_LIMIT_MAX_REQUESTS` - 请求次数

### Q: 前端无法调用后端？
A: 检查 `VITE_POSTER_API_URL` 是否配置为完整的 HTTPS URL：
```
https://[你的域名].railway.app/api/generate
```

---

**最后更新:** 2026-03-19
**Commit:** `7b98ca8`
