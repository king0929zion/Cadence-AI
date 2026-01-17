import { For } from "solid-js"

const SHORTCUTS = [
  { action: "新建对话", keys: ["Ctrl/Cmd", "N"] },
  { action: "搜索对话", keys: ["Ctrl/Cmd", "F"] },
  { action: "全局搜索", keys: ["Ctrl/Cmd", "Shift", "F"] },
  { action: "打开工具中心", keys: ["Ctrl/Cmd", "T"] },
  { action: "发送消息", keys: ["Ctrl/Cmd", "Enter"] },
  { action: "打开设置", keys: ["Ctrl/Cmd", ","] },
]

export function ShortcutsPanel() {
  return (
    <div class="flex flex-col gap-3">
      <div>
        <div class="text-14-medium text-text-strong">快捷键</div>
        <div class="mt-1 text-12-regular text-text-weak">后续支持自定义绑定。</div>
      </div>

      <div class="rounded-md border border-border-weak-base overflow-hidden">
        <For each={SHORTCUTS}>
          {(row) => (
            <div class="px-3 py-2 flex items-center justify-between border-b border-border-weak-base last:border-b-0">
              <div class="text-13-regular text-text-strong">{row.action}</div>
              <div class="flex items-center gap-1">
                <For each={row.keys}>
                  {(k) => (
                    <kbd class="px-2 py-1 rounded border border-border-weak-base bg-surface-base text-12-regular text-text-weak">
                      {k}
                    </kbd>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
