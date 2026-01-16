import { For, Match, Show, Switch, createMemo, onCleanup, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import { useNavigate, useParams } from "@solidjs/router"
import { PromptInput } from "@/components/prompt-input"
import { useSync } from "@/context/sync"
import { usePrompt } from "@/context/prompt"
import { SessionTurn } from "@opencode-ai/ui/session-turn"
import { createAutoScroll } from "@opencode-ai/ui/hooks"
import type { UserMessage } from "@opencode-ai/sdk/v2"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { useTemplate } from "@/context/template"

const QUICK_REPLIES = [
  "帮我把这段文字总结成要点和行动项：",
  "请把下面内容翻译成英文并保留格式：",
  "帮我写一封专业简洁的邮件，信息如下：",
  "我需要一个利弊分析与建议，问题是：",
]

export default function ChatSession() {
  const params = useParams()
  const navigate = useNavigate()
  const sync = useSync()
  const prompt = usePrompt()
  const templates = useTemplate()

  const info = createMemo(() => (params.id ? sync.session.get(params.id) : undefined))
  const title = createMemo(() => info()?.title || "新对话")

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

  const openCodeView = () => {
    if (params.id) {
      navigate(`/${params.dir}/session/${params.id}`)
      return
    }
    navigate(`/${params.dir}/session`)
  }

  return (
    <div
      class="relative size-full overflow-hidden flex flex-col bg-background-base"
      style={{
        "--prompt-height": store.promptHeight ? `${store.promptHeight}px` : undefined,
      }}
    >
      <header class="h-12 px-4 flex items-center justify-between border-b border-border-weak-base bg-background-stronger">
        <div class="min-w-0 flex items-center gap-2">
          <div class="text-14-medium text-text-strong truncate">{title()}</div>
          <Show when={sync.data.path.directory}>
            <div class="text-12-regular text-text-weak truncate">{sync.data.path.directory}</div>
          </Show>
        </div>
        <div class="flex items-center gap-2">
          <Button
            size="small"
            variant="ghost"
            onClick={() => navigate(`/templates?return=${encodeURIComponent(window.location.pathname)}`)}
          >
            <Icon name="dot-grid" size="small" />
            模板
          </Button>
          <Button size="small" variant="secondary" onClick={openCodeView}>
            <Icon name="layout-right" size="small" />
            编程视图
          </Button>
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
              <div class="rounded-md border border-border-weak-base bg-surface-raised-base/20 p-4">
                <div class="text-14-medium text-text-strong">开始一个新对话</div>
                <div class="mt-1 text-12-regular text-text-weak">支持图片/文件附件、模板与快捷指令（逐步完善）。</div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <For each={QUICK_REPLIES}>
                    {(text) => (
                      <button
                        class="h-8 px-3 rounded-full border border-border-weak-base bg-surface-base text-12-medium text-text-weak hover:bg-surface-raised-base-hover"
                        onClick={() => templates.queueInsert(text + "\n\n")}
                      >
                        {text.replace(/：$/, "")}
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Match>
            <Match when={params.id && userMessages().length === 0}>
              <div class="text-12-regular text-text-weak">暂无消息，发一条开始吧。</div>
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
        class="absolute inset-x-0 bottom-0 pt-10 pb-4 flex justify-center px-4 bg-gradient-to-t from-background-stronger via-background-stronger to-transparent pointer-events-none"
      >
        <div class="w-full max-w-3xl pointer-events-auto">
          <Show
            when={prompt.ready()}
            fallback={
              <div class="w-full min-h-32 rounded-md border border-border-weak-base bg-background-base/50 px-4 py-3 text-text-weak whitespace-pre-wrap pointer-events-none">
                Loading prompt...
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

