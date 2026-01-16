import { For } from "solid-js"

export function ShortcutKey(props: { keys: string[]; class?: string }) {
  return (
    <span class={["inline-flex items-center gap-1", props.class ?? ""].join(" ")}>
      <For each={props.keys}>
        {(k) => (
          <kbd class="px-2 py-1 rounded border border-border-weak-base bg-surface-base text-12-regular text-text-weak">
            {k}
          </kbd>
        )}
      </For>
    </span>
  )
}

