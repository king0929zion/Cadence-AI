import { Button } from "@opencode-ai/ui/button"
import { useServer } from "@/context/server"

export function GeneralPanel() {
  const server = useServer()
  return (
    <div class="flex flex-col gap-3">
      <div>
        <div class="text-14-medium text-text-strong">通用</div>
        <div class="mt-1 text-12-regular text-text-weak">服务器与运行状态</div>
      </div>

      <div class="rounded-md border border-border-weak-base bg-surface-raised-base/20 p-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="text-13-medium text-text-strong truncate">{server.name}</div>
          <div class="mt-1 text-12-regular text-text-weak truncate">{server.url}</div>
        </div>
        <Button size="small" variant="secondary" onClick={() => location.reload()}>
          重新连接
        </Button>
      </div>
    </div>
  )
}

