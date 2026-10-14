# src/
> L2 | 父级: /Users/epiphanyxiao/Documents/Playground/obsidian-annotation-plugin/AGENTS.md

成员清单
anchor/textAnchor.ts: 文本锚点生成与恢复，维护 offset、selectedText、prefix、suffix 与 isCode 的定位语义。
anchor/fuzzyMatch.ts: 模糊匹配恢复器，处理文件轻微改动后的锚点迁移。
editor/highlightExtension.ts: CodeMirror 6 多类型标注装饰层，使用排序 Decoration.mark 集合非侵入式绘制重叠区间。
editor/readingViewHighlight.ts: Reading View DOM 多类型标注层，稳定索引嵌套标记文本并用上下文消歧重复片段。
editor/selectionToolbar.ts: 选中文本后的浮动工具栏，提供颜色、高亮、直线、波浪线、截图、评论、复制和总览入口。
pdf/pdfAnnotationLayer.ts: PDF 注释控制器，使用页码与矩形百分比坐标绘制多类型非侵入式标注。
storage/types.ts: sidecar JSON、设置、锚点、多类型标注、便签、截图资产与索引的类型真相源。
storage/annotationStore.ts: .obsidian-annotations 持久化后端，读写文件 JSON、截图 PNG 资产与全局 index。
views/annotationPopover.ts: 窄屏与阅读模式弹层，点击高亮后展示 sidecar 中的高亮和便签内容。
views/commentModal.ts: 便签输入弹窗，统一 Markdown/PDF 创建便签时的标题和内容采集。
views/sidebarView.ts: 右侧总览面板，按类型展示标注与截图，合并关联评论，并承载搜索、颜色/类型过滤、链接复制、导出、跳转与内联编辑。
views/stickyNoteView.ts: 兼容型便利贴卡片组件，保留 Markdown 渲染、折叠与编辑。
settings/settingsTab.ts: 插件设置页，管理默认颜色、便签栏、窄屏折叠、连接线、作者和迁移策略。
utils/positioning.ts: 便签避让布局纯函数，保留给后续便签栏实验复用。
utils/textSnapshot.ts: 将 Markdown/PDF 选区文本生成主题适配的 PNG 截图片段，存入 sidecar 资产目录。

法则: 类型单一真相·业务不懂存储·渲染只做投影·UI 只做交互·总览优先于常驻叠层

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
