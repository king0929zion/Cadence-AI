import { Show, type JSX } from "solid-js"
import { ChatBubble, type ChatBubbleVariant } from "./chat-bubble"

export type ChatMessageModel = {
  id: string
  variant: ChatBubbleVariant
  content: JSX.Element
  meta?: string
}

export function ChatMessage(props: { message: ChatMessageModel }) {
  const isUser = () => props.message.variant === "user"
  return (
    <div class={["w-full flex", isUser() ? "justify-end" : "justify-start"].join(" ")}>
      <div class="min-w-0 flex flex-col gap-1">
        <ChatBubble variant={props.message.variant}>{props.message.content}</ChatBubble>
        <Show when={props.message.meta}>
          <div class={["text-11-regular text-text-weak", isUser() ? "text-right" : "text-left"].join(" ")}>
            {props.message.meta}
          </div>
        </Show>
      </div>
    </div>
  )
}

