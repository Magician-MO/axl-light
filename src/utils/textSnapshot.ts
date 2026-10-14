/**
 * [INPUT]: 接收选区纯文本与当前 Obsidian 主题的计算样式
 * [OUTPUT]: 对外提供 createTextSnapshot，将选区保存为独立 PNG 片段而不修改原文
 * [POS]: utils 模块的截图资产生成器，被 Markdown/PDF 标注入口共享
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

const MAX_WIDTH = 760;
const MIN_WIDTH = 280;
const PADDING = 24;
const LINE_HEIGHT = 26;

export async function createTextSnapshot(text: string): Promise<ArrayBuffer> {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) {
    throw new Error("Canvas is unavailable");
  }

  const bodyStyle = getComputedStyle(document.body);
  const fontFamily = bodyStyle.getPropertyValue("--font-text") || bodyStyle.fontFamily || "sans-serif";
  const font = `16px ${fontFamily}`;
  measure.font = font;
  const longest = normalized.split("\n").reduce((width, line) => Math.max(width, measure.measureText(line).width), 0);
  const cssWidth = Math.ceil(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longest + PADDING * 2)));
  const lines = wrapLines(measure, normalized, cssWidth - PADDING * 2);
  const cssHeight = Math.max(84, PADDING * 2 + lines.length * LINE_HEIGHT);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssWidth * scale);
  canvas.height = Math.ceil(cssHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable");
  }

  context.scale(scale, scale);
  context.fillStyle = bodyStyle.getPropertyValue("--background-primary").trim() || "#ffffff";
  context.fillRect(0, 0, cssWidth, cssHeight);
  context.strokeStyle = bodyStyle.getPropertyValue("--background-modifier-border").trim() || "#d0d0d0";
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, cssWidth - 1, cssHeight - 1);
  context.font = font;
  context.textBaseline = "top";
  context.fillStyle = bodyStyle.getPropertyValue("--text-normal").trim() || "#222222";
  lines.forEach((line, index) => context.fillText(line, PADDING, PADDING + index * LINE_HEIGHT));

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Could not create PNG"))), "image/png");
  });
  return blob.arrayBuffer();
}

function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const character of Array.from(paragraph)) {
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines.slice(0, 24);
}
