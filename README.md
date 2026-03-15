# OpsCareer AI (Gemini Web MVP)

基于 Next.js + Prisma + Gemini API 的智能求职助手，支持：

- 多用户注册登录与会话管理
- 每个用户独立的简历、JD、面试记录、Gemini 配置隔离
- 简历生成（基于个人档案）
- JD 定制优化与诊断
- 面试建议（问题 + 参考回答）
- 模拟面试官（逐题出题、语音回答、转写、逐题评分、整场总评）
- 面试记录与复盘
- 简历模板主题切换（Classic / Executive / Modern）
- 我的简历列表与历史版本切换
- 简历版本差异对比
- 简历版本重命名与删除
- JD 收藏库与复用
- JD 详情编辑
- JD 快捷发起简历优化与面试准备
- 面试记录筛选与状态流转
- 中英双语生成
- 投递看板（阶段看板 + 公司/岗位视图）
- Gemini Key 校验、模型检测与模型选择

## 1. 快速开始

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

打开 `http://localhost:3000`。

如果 `npm run db:push` 在你的环境报 `Schema engine error`，可使用兼容初始化命令：

```bash
npm run db:init
```

## 2. 环境变量

- `DATABASE_URL`: SQLite 数据库地址（默认 `file:./dev.db`）
- `APP_ENCRYPTION_SECRET`: 用于加密 Gemini Key（建议 32 位以上随机字符串）
- `AUTH_SECRET`: NextAuth 会话签名密钥（建议 32 位以上随机字符串）
- `DEFAULT_GEMINI_MODEL`: 默认模型（当前由配置接口动态覆盖）

## 3. API 概览

- `GET /api/applications`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/auth/register`
- `GET|POST /api/auth/[...nextauth]`
- `POST /api/gemini/validate-key`
- `GET /api/gemini/models`
- `POST /api/gemini/models`
- `POST /api/resume/generate`
- `POST /api/resume/optimize`
- `GET /api/resume/diff?baseId=...&compareId=...`
- `GET /api/resumes`
- `GET /api/resume/:id`
- `PATCH /api/resume/:id`
- `DELETE /api/resume/:id`
- `POST /api/resume/:id/theme`
- `GET /api/job-postings`
- `POST /api/job-postings`
- `GET /api/job-postings/:id`
- `PATCH /api/job-postings/:id`
- `DELETE /api/job-postings/:id`
- `POST /api/interview/prepare`
- `GET /api/mock-interviews`
- `POST /api/mock-interviews`
- `GET /api/mock-interviews/:id`
- `POST /api/mock-interviews/:id/turns`
- `POST /api/mock-interviews/:id/complete`
- `POST /api/interviews`
- `GET /api/interviews`
- `PATCH /api/interviews/:id`
- `POST /api/interviews/:id/summary`
- `GET /api/resume/:id/export?format=md|pdf`

## 4. 说明

- 首页 `/` 需要登录后访问，认证入口为 `/auth`
- 所有业务 API 都按当前登录用户执行数据隔离
- 所有 AI 生成均写入 `GenerationRun` 用于追溯
- Prompt 输入做了基础注入关键字脱敏（可继续增强）
