/**
 * [INPUT]: 依赖 CodeMirror Decoration API、obsidian editorInfoField、storage/types 的注释文档
 * [OUTPUT]: 对外提供 createHighlightExtension，在编辑器中渲染非侵入式高亮
 * [POS]: editor 模块的 CM6 高亮投影层，只画视觉效果不修改 doc
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { editorInfoField } from "obsidian";

import { FileAnnotationDocument } from "../storage/types";

interface HighlightExtensionOptions {
  getDocument: (filePath: string) => FileAnnotationDocument | null;
  getVersion: () => number;
  rememberSelection: (filePath: string, startOffset: number, endOffset: number, text: string) => void;
}

export function createHighlightExtension(options: HighlightExtensionOptions) {
  return ViewPlugin.fromClass(
    class HighlightPlugin {
      decorations: DecorationSet;
      private version = -1;

      constructor(private readonly view: EditorView) {
        this.decorations = this.buildDecorations();
        this.version = options.getVersion();
        this.captureSelection();
      }

      update(update: ViewUpdate): void {
        const nextVersion = options.getVersion();
        if (update.docChanged || update.viewportChanged || update.selectionSet || this.version !== nextVersion) {
          this.version = nextVersion;
          this.decorations = this.buildDecorations();
        }

        if (update.selectionSet) {
          this.captureSelection();
        }
      }

      private buildDecorations(): DecorationSet {
        const filePath = this.filePath();
        if (!filePath) {
          return Decoration.none;
        }

        const document = options.getDocument(filePath);
        if (!document) {
          return Decoration.none;
        }

        const docLength = this.view.state.doc.length;
        const marks = [
          ...document.highlights.map((highlight) => ({
            id: highlight.id,
            color: highlight.color,
            type: highlight.type ?? "highlight",
            anchor: highlight.anchor,
            orphaned: highlight.orphaned,
          })),
          ...document.comments.map((comment) => ({
            id: comment.id,
            color: comment.color,
            type: "highlight" as const,
            anchor: comment.anchor,
            orphaned: comment.orphaned,
          })),
        ].sort((a, b) => a.anchor.startOffset - b.anchor.startOffset);

        const ranges = [];
        for (const mark of marks) {
          if (mark.orphaned) {
            continue;
          }

          const from = Math.max(0, Math.min(mark.anchor.startOffset, docLength));
          const to = Math.max(from, Math.min(mark.anchor.endOffset, docLength));
          if (from === to) {
            continue;
          }

          ranges.push(
            Decoration.mark({
              class: `axl-annotation axl-highlight axl-highlight--${mark.color} axl-annotation--${mark.type}`,
              attributes: {
                "data-axl-color": mark.color,
                "data-axl-id": mark.id,
                "data-axl-type": mark.type,
              },
            }).range(from, to),
          );
        }

        // Decoration.set(..., true) supplies the full CodeMirror ordering, including
        // equal starts and overlapping marks. RangeSetBuilder can silently fail the
        // plugin update when repeated annotations arrive in a different side order.
        return Decoration.set(ranges, true);
      }

      private captureSelection(): void {
        const filePath = this.filePath();
        if (!filePath) {
          return;
        }

        const selection = this.view.state.selection.main;
        if (selection.empty) {
          return;
        }

        options.rememberSelection(
          filePath,
          selection.from,
          selection.to,
          this.view.state.sliceDoc(selection.from, selection.to),
        );
      }

      private filePath(): string | null {
        return this.view.state.field(editorInfoField).file?.path ?? null;
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  );
}
