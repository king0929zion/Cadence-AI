import { type ParentProps } from "solid-js"

export function ChatContainer(props: ParentProps) {
  return <div class="min-h-0 flex-1 overflow-auto">{props.children}</div>
}

