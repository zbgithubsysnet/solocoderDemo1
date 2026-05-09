# 实时聊天室系统

一个功能完整的实时聊天室系统，支持公共聊天、私聊、消息持久化和断线重连。

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [测试](#测试)
- [CI/CD](#cicd)
- [API 文档](#api-文档)
- [故障排查](#故障排查)

## 功能特性

### 核心功能
- **公共聊天**：所有在线用户都可以看到的消息
- **私聊功能**：一对一私密聊天，消息不在公共区域显示
- **消息持久化**：所有消息保存在数据库中，页面刷新后依然可见
- **在线状态**：实时显示在线用户列表，用户加入/离开时自动更新
- **离线消息**：私聊消息在用户离线时保存，上线后可查看

### 健壮性
- **断线重连**：Socket.io 内置的指数退避重连机制
- **连接状态指示**：实时显示当前连接状态
- **网络波动处理**：自动处理网络断开和重连

### UI/UX
- **响应式设计**：完美适配桌面、平板和手机
- **现代界面**：简洁美观的现代化设计
- **正在输入提示**：显示对方正在输入的状态
- **未读消息提醒**：私聊未读消息提示

## 技术栈

### 前端
- **React 18**：使用函数组件和 Hooks
- **Vite**：快速的现代化构建工具
- **Socket.io-client**：WebSocket 客户端
- **原生 CSS**：响应式设计，无额外依赖

### 后端
- **Node.js + Express**：Web 服务器框架
- **Socket.io**：实时通信引擎
- **SQLite**：轻量级嵌入式数据库（可替换为 PostgreSQL）
- **better-sqlite3**：高性能 SQLite 驱动

### 测试
- **Playwright**：现代化端到端测试框架
- **支持多用户测试**：模拟多个浏览器上下文进行测试

### 工程化
- **npm Workspaces**：Monorepo 管理
- **GitHub Actions**：持续集成和部署
- **ES Modules**：现代 JavaScript 模块系统

## 项目结构

```
solocoderDemo1/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI 配置
├── server/                      # 后端
│   ├── src/
│   │   ├── index.js            # 服务入口
│   │   ├── db.js               # 数据库操作
│   │   └── socket.js           # WebSocket 处理
│   ├── database/               # SQLite 数据库文件（运行时创建）
│   ├── package.json
│   └── .env.example
├── client/                      # 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── OnlineUsers.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── PrivateChatWindow.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js    # 自定义 Socket Hook
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── e2e/                         # E2E 测试
│   ├── tests/
│   │   └── chat.spec.js
│   ├── playwright.config.js
│   └── package.json
├── package.json                 # 根目录 Workspace 配置
├── .gitignore
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
# 安装所有依赖（包含前后端和测试）
npm install
```

### 环境配置

```bash
# 复制环境变量示例文件
cp server/.env.example server/.env

# 编辑环境变量（可选）
# 默认配置已经可以本地运行
```

### 启动开发环境

#### 方式一：分别启动（推荐开发时使用）

```bash
# 启动后端服务（终端 1）
npm run start:server

# 启动前端开发服务器（终端 2）
npm run start:client
```

#### 方式二：同时启动

```bash
npm run dev
```

### 访问应用

- 前端: http://localhost:5173
- 后端: http://localhost:3001
- 健康检查: http://localhost:3001/health

### 生产环境构建

```bash
# 构建前端生产版本
npm run build:client

# 启动生产服务器
npm run start:server
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `3001` | 后端服务端口 |
| `NODE_ENV` | `development` | 运行环境 |
| `DB_PATH` | `./database/chat.db` | 数据库文件路径 |
| `FRONTEND_URL` | `http://localhost:5173` | 前端 URL（用于 CORS） |
| `VITE_SERVER_URL` | `http://localhost:3001` | 前端连接的后端地址 |

## 测试

### E2E 测试

```bash
# 安装 Playwright 浏览器（首次运行需要）
npx playwright install chromium

# 运行所有 E2E 测试
npm run test:e2e

# 使用 UI 模式运行（调试用）
npm run test:e2e:ui

# 带调试信息运行
npm run test:e2e:debug
```

### 测试覆盖场景

1. **公共聊天**
   - 用户加入聊天室
   - 发送和接收公共消息
   - 消息持久化（刷新页面后可见）
   - 在线用户列表实时更新

2. **私聊功能**
   - 发起一对一私聊
   - 私聊消息发送和接收
   - 私聊消息不在公共区域显示
   - 未读消息提醒

3. **断线重连**
   - 模拟网络断开
   - 自动重连（指数退避）
   - 恢复连接后正常发送消息

4. **多用户场景**
   - 三个用户同时在线
   - 广播消息所有用户可见

## CI/CD

项目使用 GitHub Actions 进行持续集成。每次推送或 PR 都会触发：

1. 安装依赖
2. 构建前端和后端
3. 启动服务
4. 运行 E2E 测试
5. 上传测试报告（如有失败）

配置文件位于 `.github/workflows/ci.yml`。

## API 文档

### WebSocket 事件

#### 客户端发送

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `join` | `{ name: string }` | 用户加入聊天室 |
| `publicMessage` | `{ content: string }` | 发送公共消息 |
| `privateMessage` | `{ recipientId, recipientName, content }` | 发送私聊消息 |
| `getPrivateHistory` | `{ userId }` | 获取私聊历史 |
| `typing` | `{ recipientId? }` | 正在输入 |
| `stopTyping` | `{ recipientId? }` | 停止输入 |
| `getUsers` | - | 获取所有用户列表 |

#### 服务端发送

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `joined` | `{ userId, name, publicMessages, onlineUsers }` | 加入成功 |
| `publicMessage` | `Message` | 公共消息广播 |
| `privateMessage` | `Message` | 私聊消息 |
| `privateHistory` | `{ userId, messages }` | 私聊历史返回 |
| `userJoined` | `User` | 新用户加入 |
| `userLeft` | `User` | 用户离开 |
| `typing` | `{ userId, name, isPrivate }` | 正在输入提示 |
| `stopTyping` | `{ userId, isPrivate }` | 停止输入 |
| `usersList` | `User[]` | 用户列表 |
| `error` | `{ message }` | 错误信息 |

### HTTP 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |

## 故障排查

### 端口被占用

```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3001
lsof -i :5173
```

### 连接问题

1. 检查后端是否正常启动：`curl http://localhost:3001/health`
2. 检查环境变量中的 `VITE_SERVER_URL` 是否正确
3. 检查防火墙是否阻止了端口

### 数据库问题

- SQLite 数据库文件位于 `server/database/chat.db`
- 删除该文件可以重置所有数据
- 首次启动会自动创建数据库和表

### 测试失败

1. 确保浏览器已安装：`npx playwright install`
2. 检查服务是否在运行
3. 查看测试报告：打开 `e2e/playwright-report/index.html`

## 开发指南

### 添加新功能

1. 后端：在 `server/src/socket.js` 中添加事件处理
2. 前端：在 `client/src/hooks/useSocket.js` 中添加方法
3. 测试：在 `e2e/tests/chat.spec.js` 中添加测试用例

### 代码规范

- 使用 ES Modules (`import`/`export`)
- 遵循现有代码风格
- 添加必要的注释（复杂逻辑处）

## License

MIT
