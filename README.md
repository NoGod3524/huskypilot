# HuskyPilot V0

HuskyPilot 把 HuskyCT / Blackboard 的 ICS 日历链接转换成一个清晰的课程 deadline dashboard。V0 只做一件事：读取日历、找出未来事件、按 **Today / Tomorrow / This Week** 排序展示。

## 已经完成

- Next.js 16 + TypeScript + Tailwind CSS 项目
- 响应式 dashboard，手机和电脑都能使用
- ICS URL 输入和真实导入状态
- 后端安全下载：只接受 HTTPS、拦截内网地址、限制重定向、8 秒超时、2 MB 上限
- 解析 VEVENT、VTODO、全天事件、时区和重复事件
- 自动提取课程名，按未来 7 天分组并按时间排序
- 不连接 NetID、不爬虫、不保存密码、不保存日历 URL、不使用 AI
- 自动测试、代码检查和正式构建

> **隐私提醒：** ICS 链接通常包含一段私人 token。任何拿到链接的人都可能看到你的日历。不要把真实链接贴进 GitHub、聊天截图、代码或 `.env` 文件。只在本地运行的 HuskyPilot 输入框里粘贴。

## 0 基础：第一次运行

你需要安装：

1. [Node.js](https://nodejs.org/)（选择 LTS 版本）
2. [Git](https://git-scm.com/downloads)
3. [VS Code](https://code.visualstudio.com/)
4. VS Code 里的 **GitHub Copilot** 和 **GitHub Copilot Chat** 扩展

然后：

1. 用 VS Code 打开整个 `huskypilot` 文件夹。
2. 在顶部菜单选择 **Terminal → New Terminal**。
3. 输入 `npm install` 并按 Enter，等待安装结束。
4. 输入 `npm run dev` 并按 Enter。
5. 浏览器打开 [http://localhost:3000](http://localhost:3000)。
6. 结束运行时，在终端按 `Ctrl + C`。

如果页面显示 HuskyPilot 和示例任务，说明环境成功了。

## 获取并导入 ICS 链接

1. 在 HuskyCT / Blackboard 打开 Calendar。
2. 在日历的设置、分享或外部日历选项里寻找 **iCal / ICS / External Calendar Link**。
3. 复制完整的 HTTPS 链接。它通常很长，这是正常的。
4. 回到 HuskyPilot，粘贴链接并选择 **Import calendar**。

成功后，示例任务会被真实日历替换。日历内容只保存在当前浏览器标签页的内存中；刷新页面后会回到 demo。

## 常用命令

```bash
npm run dev      # 本地开发，代码修改后页面自动刷新
npm test         # 测试解析、分组和安全拦截
npm run lint     # 检查常见代码问题
npm run build    # 检查正式版本能否成功构建
```

## 用 GitHub Copilot 学习和继续开发

请打开 [COPILOT_PROMPTS.md](./COPILOT_PROMPTS.md)，一次只复制一条 prompt 给 Copilot Chat。每次先看 Copilot 准备改哪些文件，再接受修改，然后运行 `npm test` 和 `npm run lint`。

推荐的 VS Code 节奏：

1. 在左侧 Explorer 打开目标文件。
2. 打开 Copilot Chat。
3. 粘贴一个小 prompt。
4. 阅读 Copilot 的解释和代码差异。
5. 不懂的地方立刻追问：“Explain this change line by line for a beginner.”
6. 运行测试后再开始下一步。

## 发布到你的 GitHub

本地 Git 仓库已经初始化，第一版文件也已经放进待提交区。因为 Git 需要使用你自己的姓名和邮箱记录第一次提交，而且创建远程仓库需要你选择 private 或 public，请在 VS Code 完成最后一步：

1. 点击 VS Code 左下角账号图标，登录你的 GitHub 学生账号。
2. 打开左侧 **Source Control**。
3. 在 Message 输入 `feat: build HuskyPilot V0 calendar dashboard`，点击 **Commit**。如果 VS Code 提示配置 Git 姓名和邮箱，请按提示使用你的 GitHub 资料。
4. 点击 **Publish Branch**。
5. 建议先选择 **Publish to GitHub private repository**，仓库名保持 `huskypilot`。

切勿提交真实 ICS URL。这个项目不需要任何 `.env` 密钥。

## 项目地图

```text
src/
├─ app/
│  ├─ api/calendar/import/route.ts   # 接收 URL，安全抓取并返回事件
│  ├─ globals.css                    # 全局颜色和样式
│  ├─ layout.tsx                     # 页面标题和基础布局
│  └─ page.tsx                       # 首页入口
├─ components/dashboard.tsx          # 输入框、状态、三组任务 UI
└─ lib/
   ├─ safe-fetch.ts                  # SSRF 防护、超时、大小限制
   ├─ parse-calendar.ts              # ICS 解析和课程名提取
   ├─ calendar-view.ts               # Today / Tomorrow / This Week 分组
   └─ calendar-types.ts              # 前后端共用的数据类型
tests/calendar.test.ts               # 自动测试
```

## V0 明确不做

- 不收集 NetID 或密码
- 不登录 HuskyCT
- 不抓取网页
- 不存数据库
- 不读取成绩或邮件
- 不加入 OpenAI API 或 AI 功能

这些边界能让第一版更安全、更容易理解，也更容易真的做完。
