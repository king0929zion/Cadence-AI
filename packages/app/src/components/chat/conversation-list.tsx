import { For, Show, createMemo } from "solid-js"
import { produce } from "solid-js/store"
import type { Message, Part, Session } from "@opencode-ai/sdk/v2/client"
import { Button } from "@opencode-ai/ui/button"
import { DateTime } from "luxon"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { showToast } from "@opencode-ai/ui/toast"
import { useConversation } from "@/context/conversation"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"

function safeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim()
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function partsToText(parts: Part[]) {
  return parts
    .flatMap((p) => {
      if (p.type === "text") return [p.text]
      if (p.type === "reasoning") return [p.text]
      return []
    })
    .join("")
    .trim()
}

export function ConversationList(props: {
  directory: string
  sessions: Session[]
  selectedId?: string
  onSelect: (session: Session) => void
}) {
  const conversation = useConversation()
  const globalSDK = useGlobalSDK()
  const sync = useGlobalSync()

  const keyFor = (session: Session) => ({
    directory: props.directory,
    sessionId: session.id,
  })

  const ordered = createMemo(() => {
    return props.sessions
      .slice()
      .sort((a, b) => {
        const ap = !!conversation.metaFor(keyFor(a))?.pinned
        const bp = !!conversation.metaFor(keyFor(b))?.pinned
        if (ap !== bp) return ap ? -1 : 1
        return (b.time?.updated ?? b.time?.created ?? 0) - (a.time?.updated ?? a.time?.created ?? 0)
      })
  })

  const exportPayload = (session: Session) => {
    const [workspace] = sync.child(props.directory)
    const messages: Message[] | undefined = workspace.message[session.id]
    if (!messages?.length) return
    const partsByMessageID: Record<string, Part[]> = {}
    for (const m of messages) {
      partsByMessageID[m.id] = workspace.part[m.id] ?? []
    }
    return { directory: props.directory, session, messages, partsByMessageID }
  }

  const exportAsJson = (session: Session) => {
    const payload = exportPayload(session)
    if (!payload) {
      showToast({ title: "无法导出", description: "该对话消息尚未加载，先打开一次该对话再导出。" })
      return
    }
    const stamp = DateTime.now().toFormat("yyyyLLdd_HHmm")
    const title = safeFilename(session.title || "未命名对话")
    downloadText(`cadence-${title}-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8")
  }

  const exportAsMarkdown = (session: Session) => {
    const payload = exportPayload(session)
    if (!payload) {
      showToast({ title: "无法导出", description: "该对话消息尚未加载，先打开一次该对话再导出。" })
      return
    }

    const stamp = DateTime.now().toFormat("yyyyLLdd_HHmm")
    const title = safeFilename(session.title || "未命名对话")
    const lines: string[] = [
      `# ${session.title || "未命名对话"}`,
      ``,
      `> 项目：${props.directory}`,
      `> 导出：${DateTime.now().toISO()}`,
      ``,
      `> 注：仅导出文本/思考内容；工具输出、文件差异等请使用 JSON 导出。`,
      ``,
    ]

    for (const m of payload.messages) {
      lines.push(`## ${m.role === "user" ? "用户" : "助手"}`)
      const text = partsToText(payload.partsByMessageID[m.id] ?? [])
      lines.push(text || "_（无文本内容）_")
      lines.push("")
    }

    downloadText(`cadence-${title}-${stamp}.md`, lines.join("\n"), "text/markdown;charset=utf-8")
  }

  const archiveSession = async (session: Session) => {
    try {
      await globalSDK.client.session.update({
        directory: props.directory,
        sessionID: session.id,
        time: { archived: Date.now() },
      })

      const [, setWorkspace] = sync.child(props.directory)
      setWorkspace(
        "session",
        produce((draft) => {
          const idx = draft.findIndex((s) => s.id === session.id)
          if (idx !== -1) draft.splice(idx, 1)
        }),
      )
    } catch (err: any) {
      showToast({ title: "归档失败", description: err?.message ?? String(err) })
    }
  }

  return (
    <ul class="flex flex-col gap-1">
      <For each={ordered()}>
        {(session) => {
          const pinned = createMemo(() => !!conversation.metaFor(keyFor(session))?.pinned)

          return (
            <li class="group flex items-center gap-1">
              <Button
                size="large"
                variant="ghost"
                class="cadence-list-item w-full justify-between px-2"
                data-selected={session.id === props.selectedId}
                onClick={() => props.onSelect(session)}
              >
                <span class="min-w-0 flex items-center gap-2">
                  <span class="min-w-0 truncate text-13-regular">{session.title || "未命名对话"}</span>
                  <Show when={pinned()}>
                    <span class="shrink-0 text-11-medium text-text-weak">置顶</span>
                  </Show>
                </span>
                <span class="shrink-0 text-12-regular text-text-weak">
                  {DateTime.fromMillis(session.time?.updated ?? session.time?.created ?? 0).toRelative() ?? ""}
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenu.Trigger
                  as={IconButton}
                  icon="dots-horizontal"
                  variant="ghost"
                  class="shrink-0 size-8 rounded-md opacity-0 group-hover:opacity-100 data-[expanded]:opacity-100 data-[expanded]:bg-surface-base-active"
                  aria-label="对话菜单"
                />
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="mt-1">
                    <DropdownMenu.Item onSelect={() => conversation.togglePinned(keyFor(session))}>
                      <DropdownMenu.ItemLabel>{pinned() ? "取消置顶" : "置顶"}</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={() => exportAsMarkdown(session)}>
                      <DropdownMenu.ItemLabel>导出 Markdown</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onSelect={() => exportAsJson(session)}>
                      <DropdownMenu.ItemLabel>导出 JSON</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={() => archiveSession(session)}>
                      <DropdownMenu.ItemLabel>归档</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
            </li>
          )
        }}
      </For>
    </ul>
  )
}
