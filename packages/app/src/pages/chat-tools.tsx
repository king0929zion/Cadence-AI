import { For, Show, createMemo, createSignal } from "solid-js"
import { useLocation, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { TextField } from "@opencode-ai/ui/text-field"
import { useCommand } from "@/context/command"
import { useGlobalSync } from "@/context/global-sync"
import { base64Decode, base64Encode } from "@opencode-ai/util/encode"
import { getFilename } from "@opencode-ai/util/path"
import { useServer } from "@/context/server"

function extractDirFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\\/chat\\/([^/]+)(?:\\/|$)/)
  if (!match?.[1]) return
  try {
    return base64Decode(match[1])
  } catch {
    return
  }
}

export default function ChatTools() {
  const location = useLocation()
  const navigate = useNavigate()
  const command = useCommand()
  const sync = useGlobalSync()
  const server = useServer()

  const returnTo = createMemo(() => {
    const params = new URLSearchParams(location.search ?? "")
    const target = params.get("return")
    if (target && target.startsWith("/")) return target
    return "/chat"
  })

  const activeDirectory = createMemo(() => extractDirFromPath(returnTo()) ?? sync.data.project.at(0)?.worktree)
  const activeDirEncoded = createMemo(() => (activeDirectory() ? base64Encode(activeDirectory()!) : undefined))

  const [search, setSearch] = createSignal("")

  const slashCommands = createMemo(() => {
    const seen = new Set<string>()
    return command.options
      .filter((opt) => opt.slash && !opt.disabled)
      .filter((opt) => {
        const key = opt.slash!
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .toSorted((a, b) => a.slash!.localeCompare(b.slash!))
  })

  const filteredSlashCommands = createMemo(() => {
    const q = search().trim().toLowerCase()
    if (!q) return slashCommands()
    return slashCommands().filter((c) => {
      return (
        c.slash!.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      )
    })
  })

  const tools = createMemo(
    () =>
      [
        {
          title: "新建对话",
          description: "在当前项目中开始新的对话",
          icon: "bubble-5" as const,
          onClick: () => command.trigger("cadence.chat.new"),
        },
        {
          title: "搜索对话",
          description: "聚焦侧边栏搜索框（标题搜索）",
          icon: "magnifying-glass" as const,
          onClick: () => command.trigger("cadence.chat.search"),
        },
        {
          title: "打开设置",
          description: "主题、快捷键与通用偏好",
          icon: "settings-gear" as const,
          onClick: () => navigate("/chat/settings"),
        },
        {
          title: "管理项目",
          description: "打开项目/服务器选择页",
          icon: "folder-add-left" as const,
          onClick: () => navigate("/"),
        },
      ] as const,
  )

  return (
    <div class="cadence-page min-h-0 flex-1 overflow-auto">
      <div class="mx-auto w-full max-w-5xl px-5 py-10">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="cadence-title text-24-semibold text-text-strong">工具中心</div>
            <div class="mt-1 text-14-regular text-text-weak">更可视化的入口与快捷能力，专注日常对话体验。</div>
          </div>
          <div class="flex gap-2">
            <Button size="large" variant="secondary" onClick={() => navigate(returnTo())}>
              <Icon name="arrow-left" size="small" />
              返回
            </Button>
          </div>
        </div>

        <div class="mt-8 cadence-card p-5 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-12-regular uppercase tracking-[0.18em] text-text-weak">当前环境</div>
            <div class="mt-2 flex items-center gap-2">
              <div
                classList={{
                  "size-2 rounded-full": true,
                  "bg-icon-success-base": server.healthy() === true,
                  "bg-icon-critical-base": server.healthy() === false,
                  "bg-border-weak-base": server.healthy() === undefined,
                }}
              />
              <div class="text-14-medium text-text-strong truncate">{server.name}</div>
            </div>
            <Show when={activeDirectory()}>
              <div class="mt-1 text-12-regular text-text-weak truncate">项目：{activeDirectory()}</div>
            </Show>
          </div>

          <Show when={activeDirEncoded()}>
            <Button size="large" onClick={() => navigate(`/chat/${activeDirEncoded()}/session`)}>
              <Icon name="bubble-5" size="small" />
              进入该项目对话
            </Button>
          </Show>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <For each={tools()}>
            {(item) => (
              <button
                type="button"
                class="cadence-card p-5 text-left hover:bg-surface-raised-base-hover transition-colors"
                onClick={item.onClick}
              >
                <div class="flex items-start gap-3">
                  <div class="size-10 rounded-md border border-border-weak-base bg-surface-base flex items-center justify-center shrink-0">
                    <Icon name={item.icon} size="small" />
                  </div>
                  <div class="min-w-0">
                    <div class="text-14-medium text-text-strong">{item.title}</div>
                    <div class="mt-1 text-12-regular text-text-weak">{item.description}</div>
                  </div>
                </div>
              </button>
            )}
          </For>
        </div>

        <div class="mt-8">
          <div class="flex items-end justify-between gap-4">
            <div>
              <div class="text-14-medium text-text-strong">快捷指令</div>
              <div class="mt-1 text-12-regular text-text-weak">在输入框中输入 “/” 也可以呼出。</div>
            </div>
            <TextField
              value={search()}
              placeholder="搜索指令（/xxx）"
              class="w-full md:w-80"
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>

          <div class="mt-3 cadence-card p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <For each={filteredSlashCommands()}>
                {(opt) => (
                  <button
                    type="button"
                    class="cadence-list-item px-3 py-2 rounded-md text-left hover:bg-surface-raised-base-hover transition-colors"
                    onClick={() => {
                      command.trigger(opt.id, "slash")
                      navigate(returnTo())
                    }}
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-13-medium text-text-strong truncate">/{opt.slash}</div>
                        <div class="text-12-regular text-text-weak truncate">{opt.title}</div>
                      </div>
                      <Show when={command.keybind(opt.id)}>
                        {(kb) => (
                          <kbd class="px-2 py-1 rounded border border-border-weak-base bg-surface-base text-12-regular text-text-weak">
                            {kb()}
                          </kbd>
                        )}
                      </Show>
                    </div>
                  </button>
                )}
              </For>
            </div>
            <Show when={filteredSlashCommands().length === 0}>
              <div class="text-12-regular text-text-weak px-2 py-2">没有匹配的指令。</div>
            </Show>
          </div>
        </div>

        <div class="mt-8 cadence-card p-5">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="text-14-medium text-text-strong">最近项目</div>
              <div class="mt-1 text-12-regular text-text-weak">快速切换到其他项目的对话。</div>
            </div>
            <Button variant="secondary" onClick={() => navigate("/")}>
              <Icon name="folder" size="small" />
              管理
            </Button>
          </div>
          <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <For each={sync.data.project.slice(0, 6)}>
              {(p) => (
                <Button
                  size="large"
                  variant="ghost"
                  class="cadence-list-item justify-between px-3"
                  onClick={() => navigate(`/chat/${base64Encode(p.worktree)}/session`)}
                >
                  <div class="min-w-0 flex flex-col items-start gap-0.5">
                    <div class="text-14-medium text-text-strong truncate max-w-full">{getFilename(p.worktree)}</div>
                    <div class="text-12-regular text-text-weak truncate max-w-full">{p.worktree}</div>
                  </div>
                  <Icon name="chevron-right" size="small" class="text-text-weak" />
                </Button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
