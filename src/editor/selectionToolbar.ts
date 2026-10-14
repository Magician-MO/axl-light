/**
 * [INPUT]: 依赖 DOM selection 与 Obsidian 命令回调，接收高亮颜色与便签动作
 * [OUTPUT]: 对外提供 SelectionToolbar，在选中文本附近显示非侵入式阅读工具条
 * [POS]: editor 模块的交互入口，被 main.ts 装配并调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { ANNOTATION_COLORS, AnnotationColor, AnnotationType } from "../storage/types";

interface SelectionToolbarOptions {
  defaultColor: AnnotationColor;
  onAnnotate: (type: AnnotationType, color: AnnotationColor) => void;
  onComment: () => void;
  onCopy: () => void;
  onOpenSidebar: () => void;
}

export class SelectionToolbar {
  private readonly element: HTMLElement;
  private visible = false;
  private selectedColor: AnnotationColor;
  private readonly handleMouseUp = (): void => {
    window.setTimeout(() => this.showForSelection(), 0);
  };

  constructor(private readonly options: SelectionToolbarOptions) {
    this.selectedColor = options.defaultColor;
    this.element = document.body.createDiv({ cls: "axl-toolbar axl-selection-toolbar" });
    this.render();
    this.hide();
    document.addEventListener("mouseup", this.handleMouseUp);
  }

  destroy(): void {
    document.removeEventListener("mouseup", this.handleMouseUp);
    this.element.remove();
  }

  showForSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      this.hide();
      return;
    }

    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);
    if (!text || !isSelectionInsideWorkspace(range)) {
      this.hide();
      return;
    }

    const rect = range.getBoundingClientRect();
    this.element.style.left = `${Math.max(8, rect.left + rect.width / 2)}px`;
    this.element.style.top = `${Math.max(8, rect.top - 46)}px`;
    this.element.toggleClass("is-visible", true);
    this.visible = true;
  }

  hide(): void {
    this.element.toggleClass("is-visible", false);
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  private render(): void {
    for (const color of ANNOTATION_COLORS) {
      const button = this.element.createEl("button", {
        cls: `axl-toolbar-color axl-toolbar-color--${color}`,
        attr: {
          type: "button",
          "aria-label": `Highlight ${color}`,
          "data-axl-color": color,
        },
      });
      button.toggleClass("active", color === this.selectedColor);
      button.addEventListener("click", () => {
        this.selectedColor = color;
        for (const item of Array.from(this.element.querySelectorAll<HTMLElement>(".axl-toolbar-color"))) {
          item.toggleClass("active", item.dataset.axlColor === color);
        }
      });
    }

    this.element.createDiv({ cls: "axl-toolbar-sep" });

    for (const item of ANNOTATION_ACTIONS) {
      const button = this.iconButton(item.label, item.svg);
      button.dataset.axlType = item.type;
      button.addEventListener("click", () => this.options.onAnnotate(item.type, this.selectedColor));
    }

    this.element.createDiv({ cls: "axl-toolbar-sep" });

    const commentButton = this.iconButton("Add sticky note", NOTE_ICON);
    commentButton.addEventListener("click", () => this.options.onComment());

    const copyButton = this.iconButton("Copy", COPY_ICON);
    copyButton.addEventListener("click", () => this.options.onCopy());

    const sidebarButton = this.iconButton("Open overview", OVERVIEW_ICON);
    sidebarButton.addEventListener("click", () => this.options.onOpenSidebar());
  }

  private iconButton(label: string, svg: string): HTMLButtonElement {
    const button = this.element.createEl("button", {
      cls: "axl-toolbar-action",
      attr: {
        type: "button",
        "aria-label": label,
        title: label,
      },
    });
    button.innerHTML = svg;
    return button;
  }
}

function isSelectionInsideWorkspace(range: Range): boolean {
  const container =
    range.commonAncestorContainer instanceof HTMLElement
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

  if (!container) {
    return false;
  }

  return Boolean(
    container.closest(".workspace") ||
      container.closest(".callout-content") ||
      container.closest(".markdown-preview-view"),
  );
}

const NOTE_ICON = `
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5
      a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
`;

const COPY_ICON = `
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13"
      rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4
      a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
`;

const OVERVIEW_ICON = `
  <svg width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
`;

const HIGHLIGHT_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-9-9-4 4 9 9 4-4Z"/>
  </svg>
`;

const UNDERLINE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M6 4v7a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/>
  </svg>
`;

const WAVY_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <path d="M3 8h18"/><path d="M3 17c2-3 4 3 6 0s4 3 6 0 4 3 6 0"/>
  </svg>
`;

const SCREENSHOT_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4.5Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
`;

const ANNOTATION_ACTIONS: ReadonlyArray<{ type: AnnotationType; label: string; svg: string }> = [
  { type: "highlight", label: "Highlight", svg: HIGHLIGHT_ICON },
  { type: "underline", label: "Underline", svg: UNDERLINE_ICON },
  { type: "wavy", label: "Wavy underline", svg: WAVY_ICON },
  { type: "screenshot", label: "Screenshot annotation", svg: SCREENSHOT_ICON },
];
