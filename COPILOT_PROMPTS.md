# HuskyPilot：可以直接粘贴给 GitHub Copilot 的小任务

一次只使用一条 prompt。让 Copilot 先解释、再改一个小范围；不要让它一次重写整个应用。

## 1. 认识项目

```text
I am a complete beginner. Inspect this Next.js project without changing files. Explain the purpose of package.json, src/app/page.tsx, src/app/layout.tsx, src/app/globals.css, and the app/api folder in plain language. Then tell me the three commands I should use most often.
```

## 2. 理解 dashboard 结构

```text
Open src/components/dashboard.tsx. Do not change it yet. Explain how the sidebar, calendar URL form, import status, and three task groups are organized. Point out which parts are React state and which parts are only visual markup.
```

## 3. 修改一个 Task Card

```text
In src/components/dashboard.tsx, find TaskCard. Add one small accessible visual improvement: show the event location only when it exists, with a Lucide MapPin icon and a title tooltip. Keep the existing design. Change only this component, then explain every changed line.
```

> 这一项在当前版本已经实现。你可以让 Copilot解释现有代码，或者先撤销它提出的重复修改。

## 4. 理解时间分组

```text
Open src/lib/calendar-view.ts and tests/calendar.test.ts. Explain exactly how events are divided into Today, Tomorrow, and This Week. Use one concrete example for a timed event and one for an all-day event. Do not change code.
```

## 5. 给分组逻辑增加一个测试

```text
Add one focused test to tests/calendar.test.ts proving that a timed event earlier today is not shown, while an all-day event today is still shown. Do not change production code unless the test reveals a real bug. Run npm test and explain the result.
```

## 6. 理解 ICS 后端流程

```text
Trace one calendar import from the form in src/components/dashboard.tsx to src/app/api/calendar/import/route.ts, then to safe-fetch.ts and parse-calendar.ts, and back to the UI. Explain the request and response in beginner-friendly steps. Do not change files.
```

## 7. 检查 URL 验证

```text
Review src/lib/safe-fetch.ts only for SSRF and unsafe URL risks. Check HTTPS enforcement, credentials, custom ports, DNS resolution, private IPv4 and IPv6 ranges, redirects, timeout, and response size. Do not weaken any existing checks. Suggest at most one small improvement and wait for my approval before editing.
```

## 8. 理解 ICS 解析

```text
Open src/lib/parse-calendar.ts. Explain how VEVENT, VTODO, cancelled events, recurring events, all-day dates, course names, and sorting are handled. Tell me what MAX_EVENTS and FUTURE_WINDOW_MS protect us from. Do not edit files.
```

## 9. 增加一个解析场景

```text
Add one small calendar fixture inside tests/calendar.test.ts for an event whose summary is "[CHEM 1127Q] Lab report". Assert that the parsed course is "CHEM 1127Q" and the title is "Lab report". Run npm test. Change only the test unless it fails because of a real parser bug.
```

## 10. 完成一次安全检查

```text
Run npm test, npm run lint, and npm run build. If anything fails, explain the first failure in plain language and make the smallest possible fix. Do not add packages, do not add AI features, and do not change the product scope.
```

## 11. 提交到 Git

```text
Inspect git status and summarize the changed files for a beginner. Suggest a short conventional commit message for the HuskyPilot V0 implementation. Do not push and do not include any calendar URLs or secrets.
```

## 万用追问

当 Copilot 的回答太复杂时，直接贴：

```text
Explain this again for someone with zero programming experience. Use one small example, define every technical term
, and tell me what I should type or click next.
```
