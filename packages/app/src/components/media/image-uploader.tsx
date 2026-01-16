import { Show, createSignal } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"

export function ImageUploader(props: { accept?: string; onPick: (files: FileList) => void }) {
  let inputRef: HTMLInputElement | undefined
  const [busy, setBusy] = createSignal(false)

  return (
    <div class="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        class="hidden"
        accept={props.accept ?? "image/*,application/pdf"}
        multiple
        onChange={(e) => {
          const files = e.currentTarget.files
          if (!files || files.length === 0) return
          setBusy(true)
          try {
            props.onPick(files)
          } finally {
            setBusy(false)
            e.currentTarget.value = ""
          }
        }}
      />
      <Button
        size="small"
        variant="secondary"
        disabled={busy()}
        onClick={() => {
          inputRef?.click()
        }}
      >
        <Icon name="photo" size="small" />
        添加附件
      </Button>
      <Show when={busy()}>
        <div class="text-12-regular text-text-weak">处理中…</div>
      </Show>
    </div>
  )
}
