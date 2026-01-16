import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { type JSX } from "solid-js"
import type { TemplateModel } from "@/types/template"

export function TemplateCard(props: { template: TemplateModel; onUse?: (t: TemplateModel) => void }) {
  const handleUse = () => props.onUse?.(props.template)

  return (
    <div class="cadence-card p-4 flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-14-medium text-text-strong truncate">{props.template.title}</div>
          <div class="mt-1 text-12-regular text-text-weak">{props.template.description ?? ""}</div>
        </div>
        <div class="shrink-0 text-11-regular text-text-weak px-2 py-1 rounded bg-surface-base border border-border-weak-base">
          {props.template.category}
        </div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div class="text-12-regular text-text-weak truncate">{props.template.content}</div>
        <Button size="small" onClick={handleUse}>
          <Icon name="check" size="small" />
          使用
        </Button>
      </div>
    </div>
  ) satisfies JSX.Element
}
