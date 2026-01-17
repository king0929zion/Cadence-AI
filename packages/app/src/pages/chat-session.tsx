import { For, Match, Show, Switch, createMemo, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useNavigate, useParams } from "@solidjs/router"
import { PromptInput } from "@/components/prompt-input"
import { useSync } from "@/context/sync"
import { usePrompt } from "@/context/prompt"
import { SessionTurn } from "@opencode-ai/ui/session-turn"
import { createAutoScroll } from "@opencode-ai/ui/hooks"
import type { UserMessage } from "@opencode-ai/sdk/v2"
import { Icon } from "@opencode-ai/ui/icon"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { showToast } from "@opencode-ai/ui/toast"
import { DateTime } from "luxon"
import type { Message, Part, Session } from "@opencode-ai/sdk/v2/client"
import { useConversation } from "@/context/conversation"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"

const STARTER_SUGGESTIONS = [
  "帮我总结这段内容，并给出下一步行动项",
  "把这段内容翻译成英文（保留格式）",
  "写一封简洁专业的邮件（我会补充信息）",
  "帮我做利弊分析，并给出建议",
]

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

export default function ChatSession() {
  const params = useParams()
  const navigate = useNavigate()
  const sync = useSync()
  const prompt = usePrompt()
  const conversation = useConversation()
  const globalSDK = useGlobalSDK()
  const globalSync = useGlobalSync()

  const info = createMemo(() => (params.id ? sync.session.get(params.id) : undefined))
  const title = createMemo(() => info()?.title || "新对话")
  const directory = createMemo(() => sync.data.path.directory)
  const meta = createMemo(() => {
    if (!params.id) return
    const dir = directory()
    if (!dir) return
    return conversation.metaFor({ directory: dir, sessionId: params.id })
  })
  const pinned = createMemo(() => !!meta()?.pinned)
  const folderName = createMemo(() => {
    const folderId = meta()?.folderId
    if (!folderId) return
    return conversation.folderById().get(folderId)?.name
  })

  const messages = createMemo(() => (params.id ? (sync.data.message[params.id] ?? []) : []))
  const userMessages = createMemo(() => messages().filter((m) => m.role === "user") as UserMessage[])
  const lastUserMessageId = createMemo(() => userMessages().at(-1)?.id)

  const status = createMemo(
    () =>
      sync.data.session_status[params.id ?? ""] ?? {
        type: "idle",
      },
  )
  const isWorking = createMemo(() => status().type !== "idle")
  const autoScroll = createAutoScroll({
    working: isWorking,
  })

  const [store, setStore] = createStore({
    promptHeight: 0,
    newSessionWorktree: "main",
  })

  const newSessionWorktree = createMemo(() => {
    if (store.newSessionWorktree === "create") return "create"
    const project = sync.project
    if (project && sync.data.path.directory !== project.worktree) return sync.data.path.directory
    return "main"
  })

  let promptDockRef: HTMLDivElement | undefined
  let promptDockObserver: ResizeObserver | undefined

  onMount(() => {
    if (!promptDockRef) return
    promptDockObserver = new ResizeObserver((entries) => {
      const height = Math.round(entries[0]?.contentRect.height ?? 0)
      setStore("promptHeight", height)
    })
    promptDockObserver.observe(promptDockRef)
  })

  onCleanup(() => {
    promptDockObserver?.disconnect()
    promptDockObserver = undefined
  })

  const exportPayload = (session: Session) => {
    const sessionID = session.id
    const allMessages: Message[] = (sync.data.message[sessionID] ?? []) as Message[]
    if (!allMessages.length) return
    const partsByMessageID: Record<string, Part[]> = {}
    for (const m of allMessages) {
      partsByMessageID[m.id] = ((sync.data.part[m.id] ?? []) as Part[]).slice()
    }
    return { directory: directory(), session, messages: allMessages, partsByMessageID }
  }

  const exportAsJson = () => {
    if (!params.id) return
    const session = sync.session.get(params.id)
    if (!session) return
    const payload = exportPayload(session)
    if (!payload) {
      showToast({ title: "无法导出", description: "该对话消息尚未加载，先发一条消息或稍等同步完成。" })
      return
    }
    const stamp = DateTime.now().toFormat("yyyyLLdd_HHmm")
    const safeTitle = safeFilename(session.title || "未命名对话")
    downloadText(`cadence-${safeTitle}-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8")
  }

  const exportAsMarkdown = () => {
    if (!params.id) return
    const session = sync.session.get(params.id)
    if (!session) return
    const payload = exportPayload(session)
    if (!payload) {
      showToast({ title: "无法导出", description: "该对话消息尚未加载，先发一条消息或稍等同步完成。" })
      return
    }

    const stamp = DateTime.now().toFormat("yyyyLLdd_HHmm")
    const safeTitle = safeFilename(session.title || "未命名对话")
    const lines: string[] = [
      `# ${session.title || "未命名对话"}`,
      ``,
      `> 项目：${directory() ?? ""}`,
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

    downloadText(`cadence-${safeTitle}-${stamp}.md`, lines.join("\n"), "text/markdown;charset=utf-8")
  }

  const archiveSession = async () => {
    if (!params.id) return
    const dir = directory()
    if (!dir) return

    try {
      await globalSDK.client.session.update({
        directory: dir,
        sessionID: params.id,
        time: { archived: Date.now() },
      })

      const [, setWorkspace] = globalSync.child(dir)
      setWorkspace("session", (items) => items.filter((s) => s.id !== params.id))

      showToast({ title: "已归档", description: title() })
      navigate(`/chat/${params.dir}/session`)
    } catch (err: any) {
      showToast({ title: "归档失败", description: err?.message ?? String(err) })
    }
  }

  return (
    <div
      class="relative size-full overflow-hidden flex flex-col bg-background-base"
      style={{
        "--prompt-height": store.promptHeight ? `${store.promptHeight}px` : undefined,
      }}
    >
      <header class="cadence-session-header h-12 px-4 flex items-center justify-between">
        <div class="min-w-0 flex items-center gap-2">
          <div class="text-14-medium text-text-strong truncate">{title()}</div>
          <Show when={sync.data.path.directory}>
            <div class="text-12-regular text-text-weak truncate">{sync.data.path.directory}</div>
          </Show>
          <Show when={pinned()}>
            <div class="cadence-chip h-6 px-2 text-11-medium text-text-weak">置顶</div>
          </Show>
          <Show when={folderName()}>{(name) => <div class="cadence-chip h-6 px-2 text-11-medium text-text-weak">{name()}</div>}</Show>
        </div>
        <div class="flex items-center gap-2">
          <Show when={params.id && directory()}>
            <DropdownMenu>
              <DropdownMenu.Trigger as={IconButton} icon="dots-horizontal" variant="ghost" class="shrink-0 size-8 rounded-md" />
              <DropdownMenu.Portal>
                <DropdownMenu.Content class="mt-1">
                  <DropdownMenu.Item
                    onSelect={() => {
                      if (!params.id) return
                      const dir = directory()
                      if (!dir) return
                      conversation.togglePinned({ directory: dir, sessionId: params.id })
                    }}
                  >
                    <DropdownMenu.ItemLabel>{pinned() ? "取消置顶" : "置顶"}</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger class="flex items-center justify-between gap-3">
                      <DropdownMenu.ItemLabel>移动到文件夹</DropdownMenu.ItemLabel>
                      <Icon name="chevron-right" size="small" />
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.SubContent class="mt-1">
                        <DropdownMenu.Item
                          onSelect={() => {
                            if (!params.id) return
                            const dir = directory()
                            if (!dir) return
                            conversation.setConversationFolder({ directory: dir, sessionId: params.id }, undefined)
                          }}
                        >
                          <DropdownMenu.ItemLabel>无文件夹</DropdownMenu.ItemLabel>
                        </DropdownMenu.Item>
                        <Show when={conversation.folders().length > 0}>
                          <DropdownMenu.Separator />
                        </Show>
                        <For each={conversation.folders().slice().toSorted((a, b) => a.name.localeCompare(b.name))}>
                          {(folder) => (
                            <DropdownMenu.Item
                              onSelect={() => {
                                if (!params.id) return
                                const dir = directory()
                                if (!dir) return
                                conversation.setConversationFolder({ directory: dir, sessionId: params.id }, folder.id)
                              }}
                            >
                              <DropdownMenu.ItemLabel>{folder.name}</DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                          )}
                        </For>
                      </DropdownMenu.SubContent>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={exportAsMarkdown}>
                    <DropdownMenu.ItemLabel>导出 Markdown</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={exportAsJson}>
                    <DropdownMenu.ItemLabel>导出 JSON</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={archiveSession}>
                    <DropdownMenu.ItemLabel>归档</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => navigate(`/chat/tools?return=${encodeURIComponent(window.location.pathname)}`)}>
                    <DropdownMenu.ItemLabel>工具中心</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => navigate("/chat/settings")}>
                    <DropdownMenu.ItemLabel>设置</DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu>
          </Show>
        </div>
      </header>

      <div
        ref={autoScroll.scrollRef}
        class="flex-1 min-h-0 overflow-y-auto no-scrollbar"
        onScroll={autoScroll.handleScroll}
        onClick={autoScroll.handleInteraction}
      >
        <div ref={autoScroll.contentRef} class="mx-auto w-full max-w-3xl px-4 py-6 flex flex-col gap-6">
          <Switch>
            <Match when={!params.id}>
              <div class="cadence-card p-4">
                <div class="text-14-medium text-text-strong">开始一个新对话</div>
                <div class="mt-1 text-12-regular text-text-weak">
                  支持图片和 PDF 附件、快捷指令与会话管理（持续完善）。
                </div>
                <div class="mt-4 flex flex-col gap-2">
                  <div class="text-12-medium text-text-weak">你可以从这些问题开始：</div>
                  <ul class="pl-4 list-disc text-12-regular text-text-weak space-y-1">
                    <For each={STARTER_SUGGESTIONS}>{(text) => <li>{text}</li>}</For>
                  </ul>
                </div>
              </div>
            </Match>
            <Match when={params.id && userMessages().length === 0}>
              <div class="text-12-regular text-text-weak">暂时没有消息，发一条开始吧。</div>
            </Match>
            <Match when={true}>
              <For each={userMessages()}>
                {(message) => (
                  <div class="min-w-0 w-full">
                    <SessionTurn
                      sessionID={params.id!}
                      messageID={message.id}
                      lastUserMessageID={lastUserMessageId()}
                      stepsExpanded={false}
                      onStepsExpandedToggle={() => {}}
                      classes={{
                        root: "min-w-0 w-full",
                        container: "px-0",
                        content: "flex flex-col justify-between !overflow-visible",
                      }}
                    />
                  </div>
                )}
              </For>
            </Match>
          </Switch>

          <div class="h-[calc(var(--prompt-height,8rem)+24px)]" />
        </div>
      </div>

      <div
        ref={(el) => {
          promptDockRef = el
        }}
        class="absolute inset-x-0 bottom-0 pt-10 pb-4 flex justify-center px-4 cadence-gradient pointer-events-none"
      >
        <div class="w-full max-w-3xl pointer-events-auto">
          <Show
            when={prompt.ready()}
            fallback={
              <div class="w-full min-h-32 rounded-md border border-border-weak-base bg-background-base/50 px-4 py-3 text-text-weak whitespace-pre-wrap pointer-events-none">
                正在加载输入框...
              </div>
            }
          >
            <PromptInput
              newSessionWorktree={newSessionWorktree()}
              onNewSessionWorktreeReset={() => setStore("newSessionWorktree", "main")}
            />
          </Show>
        </div>
      </div>
    </div>
  )
}
