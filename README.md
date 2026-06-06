# 🍳 菜谱工坊 - 多人协同美食分享平台

一个面向美食爱好者的多人协同菜谱管理系统，支持菜谱创建、评分、食材反查、周计划和购物清单等功能。

## ✨ 功能特性

### 1. 菜谱管理
- ✅ 创建菜谱：菜名、食材清单（名称+用量）、步骤描述、预计耗时、难度标签（简单/中等/困难）
- ✅ 菜谱浏览和搜索：按菜名关键字搜索
- ✅ 食材反查：输入手头食材，系统返回能做的菜谱，按缺少食材数从少到多排序
- ✅ 编辑和删除自己创建的菜谱

### 2. 做过标记与评分
- ✅ 标记"做过了"，附带1-5星评分和短评
- ✅ 同一用户对同一菜谱只能标记一次，重复标记会提示
- ✅ 展示平均评分和做过的人数
- ✅ 支持按平均分排序浏览所有菜谱

### 3. 周计划与购物清单
- ✅ 把菜谱加入本周计划
- ✅ 自动汇总所有菜谱的食材生成购物清单
- ✅ 相同食材用量自动合并累加
- ✅ 购物清单支持勾选已买，状态持久化保存
- ✅ 清除本周计划时购物清单同步清空

### 4. 用户系统
- ✅ 简单的用户名注册登录
- ✅ JWT认证，自动登录状态保持
- ✅ 密码加密存储

## 🛠️ 技术栈

### 后端
- Node.js + Express
- SQLite（Sequelize ORM）
- JWT 认证
- bcryptjs 密码加密

### 前端
- React 18 + Vite
- Ant Design 组件库
- React Router 路由
- Axios HTTP请求

### 部署
- Docker + Docker Compose

## 🚀 快速开始

### 方式一：Docker Compose 一键启动（推荐）

```bash
# 在项目根目录执行
docker-compose up -d --build
```

启动后访问：
- 前端：http://localhost:5173
- 后端API：http://localhost:3001
- 健康检查：http://localhost:3001/api/health

### 方式二：本地开发运行

#### 启动后端
```bash
cd backend
npm install
npm start
```
后端运行在 http://localhost:3001

#### 启动前端
```bash
cd frontend
npm install
npm run dev
```
前端运行在 http://localhost:5173

## 📡 API 接口文档

### 用户认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户信息 |

### 菜谱管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/recipes | 获取菜谱列表（支持search、sortBy、ingredients参数） |
| POST | /api/recipes | 创建菜谱 |
| GET | /api/recipes/:id | 获取菜谱详情 |
| PUT | /api/recipes/:id | 更新菜谱 |
| DELETE | /api/recipes/:id | 删除菜谱 |

### 评分系统
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/ratings/:recipeId | 标记做过并评分 |
| GET | /api/ratings/:recipeId/check | 检查是否已评分 |

### 周计划与购物清单
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/weekly-plans/current | 获取本周计划和购物清单 |
| POST | /api/weekly-plans/add-recipe | 添加菜谱到周计划 |
| POST | /api/weekly-plans/remove-recipe | 从周计划移除菜谱 |
| PUT | /api/weekly-plans/shopping-item/:id | 更新购物项购买状态 |
| DELETE | /api/weekly-plans/clear | 清空本周计划 |

## 📁 项目结构

```
lwj-64/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── middleware/        # 中间件
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # API路由
│   │   ├── init-db.js         # 数据库初始化
│   │   └── server.js          # 服务器入口
│   ├── data/                  # 数据库文件目录
│   ├── package.json
│   ├── .env
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── api/               # API请求封装
│   │   ├── context/           # React Context
│   │   ├── pages/             # 页面组件
│   │   ├── App.jsx            # 根组件
│   │   ├── main.jsx           # 入口文件
│   │   └── index.css          # 全局样式
│   ├── package.json
│   ├── vite.config.js         # 本地开发配置
│   ├── vite.config.docker.js  # Docker环境配置
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml         # Docker Compose配置
├── .gitignore
└── README.md
```

## 🎯 使用说明

### 1. 注册登录
1. 访问 http://localhost:5173
2. 点击"立即注册"创建账号
3. 登录后进入菜谱库

### 2. 创建菜谱
1. 点击导航栏的"创建菜谱"
2. 填写菜名、食材、步骤、预计耗时和难度
3. 点击"发布菜谱"

### 3. 搜索菜谱
- **按菜名搜索**：在搜索框输入菜名关键字
- **按食材反查**：输入手头有的食材（用逗号分隔），系统会返回能做的菜谱，按缺少食材数排序
- **按评分排序**：选择"评分最高"排序方式

### 4. 标记做过并评分
1. 进入菜谱详情页
2. 点击"标记做过"按钮
3. 选择1-5星评分，可添加短评
4. 提交后评分和做过人数会自动更新

### 5. 周计划与购物清单
1. 在菜谱列表或详情页点击"加入周计划"
2. 点击导航栏的"周计划 & 购物清单"
3. 查看本周计划的菜谱和自动生成的购物清单
4. 勾选已购买的食材，状态会自动保存
5. 可一键清空本周计划（购物清单同步清空）

## 💾 数据持久化

- SQLite数据库文件存储在 `backend/data/recipes.db`
- 通过Docker volume挂载，容器重启不丢失数据
- 购物清单的勾选状态存储在数据库中

## 🧪 测试数据

系统启动后可以注册用户并创建测试菜谱，例如：

**菜谱1：番茄炒蛋**
- 食材：番茄2个、鸡蛋3个、盐适量、糖1小勺
- 耗时：15分钟
- 难度：简单

**菜谱2：青椒肉丝**
- 食材：猪肉200g、青椒3个、生抽1勺、淀粉1勺、盐适量
- 耗时：25分钟
- 难度：中等

**菜谱3：红烧肉**
- 食材：五花肉500g、冰糖30g、生抽2勺、老抽1勺、料酒1勺、八角2个、桂皮1小块
- 耗时：60分钟
- 难度：困难

## 📝 注意事项

1. 首次启动Docker时会自动安装依赖和构建项目，可能需要几分钟
2. 数据库文件会自动创建在 `backend/data/` 目录下
3. 如果需要重置数据，删除 `backend/data/recipes.db` 文件后重启服务即可
4. 前端开发模式下访问 http://localhost:5173，生产构建后访问相同地址

## 🤝 多人协作说明

- 每个用户注册独立账号
- 可以看到所有用户创建的菜谱
- 可以对任何菜谱标记"做过了"并评分
- 只能编辑和删除自己创建的菜谱
- 周计划和购物清单是每个用户独立的

## 🛡️ 安全说明

- 密码使用bcryptjs加密存储
- JWT token有效期30天
- API接口需要认证才能访问（除了注册登录）
- 只能修改自己创建的内容

---

🍳 享受美食，享受烹饪！
