# 快速修复：清理冗余筛选代码

## 需要删除的代码（App.jsx）

1. 第 381-382 行：
```javascript
const [mediaFilter, setMediaFilter] = useState('all')
const [actionFilter, setActionFilter] = useState('all')
```

2. 第 451-455 行筛选逻辑中的 media 和 action 部分

3. 第 461 行依赖项中的 actionFilter 和 mediaFilter

4. 删除 MEDIA_FILTER_OPTIONS 和 ACTION_FILTER_OPTIONS 常量

5. TopBar props 中删除相关参数

## 执行方式
直接使用 edit 工具修改 App.jsx

开始执行。
