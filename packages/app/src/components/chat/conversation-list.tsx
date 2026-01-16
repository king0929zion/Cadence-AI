import { For, createMemo } from "solid-js"
import type { Session } from "@opencode-ai/sdk/v2/client"
import { Button } from "@opencode-ai/ui/button"
import { DateTime } from "luxon"

export function ConversationList(props: {
  sessions: Session[]
  selectedId?: string
  onSelect: (session: Session) => void
}) {
  const ordered = createMemo(() => {
    return props.sessions
      .slice()
      .sort((a, b) => (b.time?.updated ?? b.time?.created ?? 0) - (a.time?.updated ?? a.time?.created ?? 0))
  })

  return (
    <ul class="flex flex-col gap-1">
      <For each={ordered()}>
        {(session) => (
          <li>
            <Button
              size="large"
              variant="ghost"
              class="w-full justify-between px-2"
              data-selected={session.id === props.selectedId}
              onClick={() => props.onSelect(session)}
            >
              <span class="min-w-0 truncate text-13-regular">{session.title || "Untitled"}</span>
              <span class="shrink-0 text-12-regular text-text-weak">
                {DateTime.fromMillis(session.time?.updated ?? session.time?.created ?? 0).toRelative() ?? ""}
              </span>
            </Button>
          </li>
        )}
      </For>
    </ul>
  )
}

