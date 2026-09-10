export type Locale = "en" | "zh-CN";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "huskypilot.locale.v1";

const en = {
  "app.name": "HuskyPilot",
  "app.subtitle": "Student command center",
  "nav.dashboard": "Dashboard",
  "nav.tasks": "Tasks",
  "nav.calendar": "Calendar",
  "sidebar.demoCalendar": "Demo calendar",
  "sidebar.calendarConnected": "Calendar connected",
  "sidebar.importedDescription": "Your imported events are saved only in this browser.",
  "sidebar.connectDescription": "Connect your own ICS link whenever you are ready.",
  "sidebar.lastImported": "Last imported: {value}",
  "sidebar.restoredFromStorage": "Restored from saved browser data.",
  "sidebar.statusImported": "Imported successfully",
  "sidebar.statusSavedAvailable": "Saved import available",
  "sidebar.statusReady": "Ready to sync",
  "header.studentName": "Husky Student",
  "header.privateDashboard": "Your private dashboard",
  "hero.title": "Your week, cleared for takeoff.",
  "hero.description": "Connect HuskyCT once. We'll turn your calendar into one calm, ordered list of what is due next.",
  "hero.dueCount": "{count} due in the next 7 days",
  "deadlineRadar.eyebrow": "Deadline radar",
  "deadlineRadar.heading": "What's ahead",
  "connect.title": "Connect your HuskyCT calendar",
  "connect.description": "Paste the private ICS calendar link from Blackboard. Your NetID and password are never requested.",
  "connect.inputLabel": "HuskyCT ICS calendar URL",
  "connect.placeholder": "https://.../calendar.ics",
  "connect.importing": "Importing…",
  "connect.importButton": "Import calendar",
  "actions.useDemo": "Use demo",
  "actions.restoreSavedImport": "Restore saved import",
  "actions.clearSavedData": "Clear saved data",
  "actions.demoPreview": "Demo preview",
  "group.today": "Today",
  "group.tomorrow": "Tomorrow",
  "group.week": "This Week",
  "empty.nothingDue": "Nothing due here. Nice.",
  "badge.dueSoon": "DUE SOON",
  "task.markComplete": 'Mark "{title}" as complete',
  "task.markIncomplete": 'Mark "{title}" as not complete',
  "notices.restoredImported": "Restored your saved imported events.",
  "notices.corruptDataCleared": "Saved calendar data was invalid and has been cleared.",
  "notices.demoRestored": "Demo data restored.",
  "notices.demoRestoredWithSaved": "Demo data restored. Saved imported data is still available.",
  "notices.savedDataCleared": "Saved imported calendar data has been cleared.",
  "notices.savedImportRestored": "Saved imported events restored.",
  "notices.importedEvent": "Imported {count} future event.",
  "notices.importedEvents": "Imported {count} future events.",
  "errors.noSavedImport": "No saved imported data was found.",
  "errors.importFailed": "The calendar could not be imported.",
  "time.allDay": "All day",
  "language.label": "Language",
  "language.english": "English",
  "language.chinese": "简体中文",
  "language.switchToEnglish": "Switch to English",
  "language.switchToChinese": "Switch to Simplified Chinese",
  "insights.eyebrow": "Insights",
  "insights.heading": "Your workload at a glance",
  "insights.empty": "Nothing to analyze yet. Import a calendar to see your workload.",
  "insights.completion": "Completion",
  "insights.completedOf": "{completed} of {total} done",
  "insights.byCourse": "Tasks by course",
  "insights.nextSevenDays": "Next 7 days",
  "insights.byWeek": "Next 4 weeks",
  "insights.uncategorized": "Uncategorized",
  "insights.week": "Week {index}",
} as const;

const zhCN: Record<TranslationKey, string> = {
  "app.name": "HuskyPilot",
  "app.subtitle": "学生指挥中心",
  "nav.dashboard": "仪表盘",
  "nav.tasks": "任务",
  "nav.calendar": "日历",
  "sidebar.demoCalendar": "演示日历",
  "sidebar.calendarConnected": "日历已连接",
  "sidebar.importedDescription": "导入的日程仅保存在此浏览器中。",
  "sidebar.connectDescription": "准备好后随时连接你自己的 ICS 链接。",
  "sidebar.lastImported": "上次导入：{value}",
  "sidebar.restoredFromStorage": "已从浏览器保存的数据恢复。",
  "sidebar.statusImported": "导入成功",
  "sidebar.statusSavedAvailable": "有已保存的导入数据",
  "sidebar.statusReady": "可以同步",
  "header.studentName": "哈士奇同学",
  "header.privateDashboard": "你的私人仪表盘",
  "hero.title": "本周日程，一目了然。",
  "hero.description": "连接一次 HuskyCT，我们会把你的日历整理成一份清晰有序的待办清单。",
  "hero.dueCount": "未来 7 天内共 {count} 项待办",
  "deadlineRadar.eyebrow": "截止日期雷达",
  "deadlineRadar.heading": "接下来的安排",
  "connect.title": "连接你的 HuskyCT 日历",
  "connect.description": "粘贴来自 Blackboard 的私有 ICS 日历链接。系统不会要求提供你的 NetID 或密码。",
  "connect.inputLabel": "HuskyCT ICS 日历链接",
  "connect.placeholder": "https://.../calendar.ics",
  "connect.importing": "导入中…",
  "connect.importButton": "导入日历",
  "actions.useDemo": "使用演示数据",
  "actions.restoreSavedImport": "恢复已保存的导入",
  "actions.clearSavedData": "清除已保存的数据",
  "actions.demoPreview": "演示预览",
  "group.today": "今天",
  "group.tomorrow": "明天",
  "group.week": "本周",
  "empty.nothingDue": "这里暂无待办事项，真棒。",
  "badge.dueSoon": "即将到期",
  "task.markComplete": '将“{title}”标记为已完成',
  "task.markIncomplete": '将“{title}”标记为未完成',
  "notices.restoredImported": "已恢复你保存的导入日程。",
  "notices.corruptDataCleared": "保存的日历数据无效，已被清除。",
  "notices.demoRestored": "已恢复演示数据。",
  "notices.demoRestoredWithSaved": "已恢复演示数据。已保存的导入数据仍然可用。",
  "notices.savedDataCleared": "已保存的导入日历数据已被清除。",
  "notices.savedImportRestored": "已恢复保存的导入日程。",
  "notices.importedEvent": "已导入 {count} 个未来的日程事件。",
  "notices.importedEvents": "已导入 {count} 个未来的日程事件。",
  "errors.noSavedImport": "未找到已保存的导入数据。",
  "errors.importFailed": "无法导入该日历。",
  "time.allDay": "全天",
  "language.label": "语言",
  "language.english": "English",
  "language.chinese": "简体中文",
  "language.switchToEnglish": "切换为英文",
  "language.switchToChinese": "切换为简体中文",
  "insights.eyebrow": "洞察",
  "insights.heading": "你的任务负担一览",
  "insights.empty": "暂无可分析的任务。导入日历后即可看到负担分析。",
  "insights.completion": "完成率",
  "insights.completedOf": "已完成 {completed} / {total}",
  "insights.byCourse": "各课程任务量",
  "insights.nextSevenDays": "未来 7 天",
  "insights.byWeek": "未来 4 周",
  "insights.uncategorized": "未分类",
  "insights.week": "第 {index} 周",
};

export type TranslationKey = keyof typeof en;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  "zh-CN": zhCN,
};

export function t(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template = dictionaries[locale]?.[key] ?? en[key];
  if (!params) return template;

  return Object.entries(params).reduce(
    (text, [paramName, paramValue]) =>
      text.replaceAll(`{${paramName}}`, String(paramValue)),
    template,
  );
}

/** Locale tag to use with `Intl.DateTimeFormat` and similar APIs. */
export function intlLocale(locale: Locale): string {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-CN";
}

export function restoreLocale(storage: Storage): Locale {
  const stored = storage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function saveLocale(storage: Storage, locale: Locale) {
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}
