import { For } from "solid-js"

export function QuickReply(props: { items: string[]; onSelect: (text: string) => void }) {
  return (
    <div class="flex flex-wrap gap-2">
      <For each={props.items}>
        {(text) => (
          <button
            class="cadence-chip h-8 px-3 text-12-medium text-text-weak"
            onClick={() => props.onSelect(text)}
          >
            {text}
          </button>
        )}
      </For>
    </div>
  )
}
