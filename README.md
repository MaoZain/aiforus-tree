# Three.js + MediaPipe HTML Generator Service

这是一个无状态的 Node.js 后端服务，用于生成包含 Three.js 和 MediaPipe 互动逻辑的静态 HTML 页面。

## 🚀 功能特性

*   **一次性生成**：接收用户数据（文本、图片），生成独立的 HTML 文件。
*   **无数据库**：所有数据内嵌于 HTML，无需数据库存储。
*   **自动清理**：内置定时任务，自动删除过期的 HTML 文件夹（默认 24 小时）。
*   **Docker 化**：提供完整的 Docker 部署方案。
*   **静态分发**：生成的 HTML 可直接通过 Nginx/Apache 访问。

## 📂 目录结构

```
src/
├── app.js                 # 入口文件
├── config/                # 配置
├── routes/                # 路由定义
├── services/              # 业务逻辑 (生成、清理)
├── templates/             # HTML 模板
└── utils/                 # 工具函数
public/
└── generated/             # 生成的 HTML 文件存放处 (Docker Volume)
```

## 🛠️ 快速开始

### 本地开发

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **配置环境变量** (可选)
    复制 `.env.example` 为 `.env` 并修改配置。

3.  **启动服务**
    ```bash
    npm run dev
    ```

### Docker 部署

1.  **构建并启动**
    ```bash
    docker-compose up -d --build
    ```

2.  **验证**
    访问 `http://localhost:3000/health` 应返回 `{"status":"ok"}`。

## 🔌 接口文档

### 生成 HTML

*   **URL**: `/api/generate`
*   **Method**: `POST`
*   **Content-Type**: `application/json`

**请求体示例:**

```json
{
  "text": "Merry Christmas!",
  "images": ["data:image/png;base64,iVBORw0KGgo..."],
  "theme": "gold",
  "config": {
    "particleCount": 100
  }
}
```

**响应示例:**

```json
{
  "id": "V1StGXR8_Z",
  "url": "https://your-domain.com/generated/V1StGXR8_Z/"
}
```

## 🌐 前端对接指南 (Vue)

在 Vue 前端中，使用 `fetch` 或 `axios` 调用此接口：

```javascript
async function submitData() {
  const response = await fetch('https://api.your-domain.com/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: this.userText,
      images: [this.base64Image],
      theme: 'gold'
    })
  });
  
  const result = await response.json();
  console.log('Share URL:', result.url);
}
```

## 🔒 安全与权限

1.  **HTTPS**: 由于使用了 `getUserMedia` (摄像头) 和 `MediaPipe`，生成的 HTML 页面 **必须** 在 HTTPS 环境下访问，否则 Chrome 会阻止摄像头权限。
2.  **CORS**: 默认开启 CORS 允许跨域，生产环境建议在 Nginx 层或代码中限制 Origin。

## ⚙️ 部署配置 (Apache/Nginx)

本服务只负责生成文件，文件访问建议通过 Nginx/Apache 直接代理 `public/generated` 目录。

**Nginx 示例:**

```nginx
location /generated/ {
    alias /path/to/project/public/generated/;
    index index.html;
}
```
