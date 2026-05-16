"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation as AIToolInvocation } from "ai";

function basename(path: unknown): string | null {
  if (typeof path !== "string" || path.length === 0) return null;
  const last = path.split("/").filter(Boolean).pop();
  return last ?? path;
}

export function formatToolInvocation(
  toolName: string,
  args: Record<string, unknown> | undefined | null
): string {
  const a = (args ?? {}) as Record<string, unknown>;
  const command = a.command as string | undefined;
  const name = basename(a.path);

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return name ? `Creating ${name}` : "Creating file";
      case "str_replace":
      case "insert":
        return name ? `Editing ${name}` : "Editing file";
      case "view":
        return name ? `Viewing ${name}` : "Viewing file";
      case "undo_edit":
        return name ? `Reverting ${name}` : "Reverting file";
      default:
        return name ? `Modifying ${name}` : toolName;
    }
  }

  if (toolName === "file_manager") {
    const newName = basename(a.new_path);
    switch (command) {
      case "rename":
        return name && newName ? `Renaming ${name} → ${newName}` : "Renaming file";
      case "delete":
        return name ? `Deleting ${name}` : "Deleting file";
      default:
        return name ? `Modifying ${name}` : toolName;
    }
  }

  return toolName;
}

interface ToolInvocationProps {
  toolInvocation: AIToolInvocation;
}

export function ToolInvocation({ toolInvocation }: ToolInvocationProps) {
  const label = formatToolInvocation(
    toolInvocation.toolName,
    toolInvocation.args as Record<string, unknown> | undefined
  );
  const isComplete =
    toolInvocation.state === "result" &&
    (toolInvocation as { result?: unknown }).result !== undefined;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div
          data-testid="tool-status-done"
          className="w-2 h-2 rounded-full bg-emerald-500"
        />
      ) : (
        <Loader2
          data-testid="tool-status-pending"
          className="w-3 h-3 animate-spin text-blue-600"
        />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
