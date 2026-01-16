import { Show, createSignal } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"

export function FolderManager() {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="flex items-center justify-between">
      <div class="text-12-medium text-text-weak">文件夹</div>
      <Button size="small" variant="ghost" onClick={() => setOpen((v) => !v)}>
        <Icon name={open() ? "chevron-down" : "chevron-right"} size="small" />
        管理
      </Button>
      <Show when={false}>{/* 预留：文件夹 CRUD */}</Show>
    </div>
  )
}
