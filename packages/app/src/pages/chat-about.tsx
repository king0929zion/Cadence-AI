import { useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { AboutPanel } from "@/components/settings/about-panel"

export default function ChatAbout() {
  const navigate = useNavigate()

  return (
    <div class="cadence-page min-h-0 flex-1 overflow-auto">
      <div class="mx-auto w-full max-w-5xl px-5 py-10">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="cadence-title text-24-semibold text-text-strong">关于</div>
            <div class="mt-1 text-14-regular text-text-weak">版本信息、更新与下载入口。</div>
          </div>
          <Button size="large" variant="secondary" onClick={() => navigate("/chat")}>
            <Icon name="bubble-5" size="small" />
            返回对话
          </Button>
        </div>

        <div class="mt-6">
          <AboutPanel />
        </div>
      </div>
    </div>
  )
}
