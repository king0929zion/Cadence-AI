import { createMemo } from "solid-js"
import { useLocation, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { showToast } from "@opencode-ai/ui/toast"
import { TemplatePanel } from "@/components/template/template-panel"
import { useTemplate } from "@/context/template"
import type { TemplateModel } from "@/types/template"

export default function TemplateLibrary() {
  const location = useLocation()
  const navigate = useNavigate()
  const templates = useTemplate()

  const all = createMemo(() => templates.templates())
  const returnTo = createMemo(() => {
    const params = new URLSearchParams(location.search ?? "")
    const target = params.get("return")
    if (target && target.startsWith("/")) return target
    return "/chat"
  })

  async function useOne(t: TemplateModel) {
    try {
      await navigator.clipboard.writeText(t.content)
      showToast({ title: "已复制模板到剪贴板", description: t.title })
    } catch (e) {
      showToast({ title: "复制失败", description: (e as Error).message })
    }
    templates.queueInsert(t.content)
    navigate(returnTo())
  }

  return (
    <div class="min-h-0 flex-1 overflow-auto">
      <div class="mx-auto w-full max-w-4xl px-4 py-10">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-24-semibold text-text-strong">提示词模板库</div>
            <div class="mt-1 text-14-regular text-text-weak">内置常用模板，后续会支持自定义与分类管理。</div>
          </div>
          <div class="flex gap-2">
            <Button size="large" variant="secondary" onClick={() => navigate("/chat")}>
              <Icon name="bubble-5" size="small" />
              返回对话
            </Button>
            <Button size="large" onClick={() => navigate("/settings")}>
              <Icon name="settings-gear" size="small" />
              设置
            </Button>
          </div>
        </div>

        <div class="mt-8">
          <TemplatePanel templates={all()} onUse={useOne} />
        </div>
      </div>
    </div>
  )
}

