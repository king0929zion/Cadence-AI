import { For, Show } from "solid-js"
import { IconButton } from "@opencode-ai/ui/icon-button"

export type AttachmentItem = {
  id: string
  label: string
  onPreview?: () => void
  onRemove?: () => void
}

export function AttachmentBar(props: { items: AttachmentItem[] }) {
  return (
    <Show when={props.items.length > 0}>
      <div class="flex flex-wrap gap-2 px-2 py-2 border border-border-weak-base rounded-md bg-surface-base">
        <For each={props.items}>
          {(item) => (
            <div class="flex items-center gap-2 px-2 py-1 rounded-md border border-border-weak-base bg-surface-raised-base/20">
              <button class="text-12-regular text-text-strong hover:underline" onClick={() => item.onPreview?.()}>
                {item.label}
              </button>
              <IconButton icon="circle-x" size="normal" variant="ghost" onClick={() => item.onRemove?.()} />
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}
