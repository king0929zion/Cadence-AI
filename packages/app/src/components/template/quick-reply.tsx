import { For } from "solid-js"

export function QuickReply(props: { items: string[]; onSelect: (text: string) => void }) {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={props.items}>
        {(text) => (
          <button
            class="h-8 px-3 rounded-full border border-border-weak-base bg-surface-base text-12-medium text-text-weak hover:bg-surface-raised-base-hover"
            onClick={() => props.onSelect(text)}
          >
            {text}
          </button>
        )}
      </For>
    </div>
  )
}

