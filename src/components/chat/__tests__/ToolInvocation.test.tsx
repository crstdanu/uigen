import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocation, formatToolInvocation } from "../ToolInvocation";
import type { ToolInvocation as AIToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

test("formatToolInvocation: str_replace_editor create -> 'Creating <name>'", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "create",
      path: "/components/Card.jsx",
    })
  ).toBe("Creating Card.jsx");
});

test("formatToolInvocation: str_replace_editor str_replace -> 'Editing <name>'", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "str_replace",
      path: "/App.jsx",
    })
  ).toBe("Editing App.jsx");
});

test("formatToolInvocation: str_replace_editor insert -> 'Editing <name>'", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "insert",
      path: "/components/Button.tsx",
    })
  ).toBe("Editing Button.tsx");
});

test("formatToolInvocation: str_replace_editor view -> 'Viewing <name>'", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "view",
      path: "/App.jsx",
    })
  ).toBe("Viewing App.jsx");
});

test("formatToolInvocation: str_replace_editor undo_edit -> 'Reverting <name>'", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "undo_edit",
      path: "/App.jsx",
    })
  ).toBe("Reverting App.jsx");
});

test("formatToolInvocation: file_manager rename -> 'Renaming <old> → <new>'", () => {
  expect(
    formatToolInvocation("file_manager", {
      command: "rename",
      path: "/components/Old.jsx",
      new_path: "/components/New.jsx",
    })
  ).toBe("Renaming Old.jsx → New.jsx");
});

test("formatToolInvocation: file_manager rename without new_path -> generic", () => {
  expect(
    formatToolInvocation("file_manager", {
      command: "rename",
      path: "/components/Old.jsx",
    })
  ).toBe("Renaming file");
});

test("formatToolInvocation: file_manager delete -> 'Deleting <name>'", () => {
  expect(
    formatToolInvocation("file_manager", {
      command: "delete",
      path: "/components/Card.jsx",
    })
  ).toBe("Deleting Card.jsx");
});

test("formatToolInvocation: nested path uses just the basename", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "create",
      path: "/src/components/forms/ContactForm.jsx",
    })
  ).toBe("Creating ContactForm.jsx");
});

test("formatToolInvocation: missing path falls back to generic phrase", () => {
  expect(
    formatToolInvocation("str_replace_editor", { command: "create" })
  ).toBe("Creating file");
});

test("formatToolInvocation: missing args returns raw toolName", () => {
  expect(formatToolInvocation("str_replace_editor", undefined)).toBe(
    "str_replace_editor"
  );
});

test("formatToolInvocation: unknown command falls back gracefully", () => {
  expect(
    formatToolInvocation("str_replace_editor", {
      command: "mystery",
      path: "/App.jsx",
    })
  ).toBe("Modifying App.jsx");
});

test("formatToolInvocation: unknown tool returns its raw name", () => {
  expect(
    formatToolInvocation("some_unknown_tool", { command: "x", path: "/y.jsx" })
  ).toBe("some_unknown_tool");
});

test("ToolInvocation renders the friendly label", () => {
  const invocation = {
    state: "call",
    toolCallId: "id1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/components/Card.jsx" },
  } as unknown as AIToolInvocation;

  render(<ToolInvocation toolInvocation={invocation} />);

  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
  expect(screen.queryByText("str_replace_editor")).toBeNull();
});

test("ToolInvocation shows pending spinner while state is 'call'", () => {
  const invocation = {
    state: "call",
    toolCallId: "id1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  } as unknown as AIToolInvocation;

  render(<ToolInvocation toolInvocation={invocation} />);

  expect(screen.getByTestId("tool-status-pending")).toBeDefined();
  expect(screen.queryByTestId("tool-status-done")).toBeNull();
});

test("ToolInvocation shows pending spinner while state is 'partial-call'", () => {
  const invocation = {
    state: "partial-call",
    toolCallId: "id1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  } as unknown as AIToolInvocation;

  render(<ToolInvocation toolInvocation={invocation} />);

  expect(screen.getByTestId("tool-status-pending")).toBeDefined();
});

test("ToolInvocation shows green dot when state is 'result' with a result", () => {
  const invocation = {
    state: "result",
    toolCallId: "id1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    result: "File created: /App.jsx",
  } as unknown as AIToolInvocation;

  render(<ToolInvocation toolInvocation={invocation} />);

  expect(screen.getByTestId("tool-status-done")).toBeDefined();
  expect(screen.queryByTestId("tool-status-pending")).toBeNull();
});

test("ToolInvocation renders file_manager rename label", () => {
  const invocation = {
    state: "result",
    toolCallId: "id2",
    toolName: "file_manager",
    args: {
      command: "rename",
      path: "/components/Old.jsx",
      new_path: "/components/New.jsx",
    },
    result: { success: true },
  } as unknown as AIToolInvocation;

  render(<ToolInvocation toolInvocation={invocation} />);

  expect(screen.getByText("Renaming Old.jsx → New.jsx")).toBeDefined();
});
