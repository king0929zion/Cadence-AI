import { type ParentProps, splitProps } from "solid-js"

export type ChatBubbleVariant = "user" | "assistant" | "system"

export function ChatBubble(props: ParentProps<{ variant?: ChatBubbleVariant; class?: string }>) {
  const [split, rest] = splitProps(props, ["variant", "class", "children"])
  const variant = () => split.variant ?? "assistant"

  return (
    <div
      {...rest}
      data-component="chat-bubble"
      data-variant={variant()}
      class={[
        "max-w-[min(720px,100%)] rounded-2xl px-4 py-3 text-14-regular leading-relaxed border",
        variant() === "user"
          ? "ml-auto bg-surface-info-base/15 border-border-weak-base text-text-strong"
          : variant() === "system"
            ? "mx-auto bg-surface-base border-border-weak-base text-text-weak"
            : "mr-auto bg-surface-raised-base/30 border-border-weak-base text-text-strong",
        split.class ?? "",
      ].join(" ")}
    >
      {split.children}
    </div>
  )
}

