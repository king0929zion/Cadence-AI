import { Show, type JSX } from "solid-js"
import { IconButton } from "@opencode-ai/ui/icon-button"

export function PreviewModal(props: { open: boolean; title?: string; onClose: () => void; children: JSX.Element }) {
  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <button class="absolute inset-0 bg-black/40" onClick={props.onClose} />
        <div class="relative w-[min(920px,calc(100vw-32px))] h-[min(720px,calc(100vh-32px))] rounded-md border border-border-base bg-surface-raised-stronger-non-alpha shadow-md overflow-hidden">
          <div class="h-12 px-3 flex items-center justify-between border-b border-border-weak-base">
            <div class="text-14-medium text-text-strong truncate">{props.title ?? "预览"}</div>
            <IconButton icon="circle-x" variant="ghost" onClick={props.onClose} />
          </div>
          <div class="p-4 overflow-auto h-[calc(100%-48px)]">{props.children}</div>
        </div>
      </div>
    </Show>
  )
}
