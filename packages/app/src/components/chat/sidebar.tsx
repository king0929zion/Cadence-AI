import { createMemo, For, Match, Show, Switch } from "solid-js"
import { createStore } from "solid-js/store"
import { A, useLocation, useNavigate, useParams } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { TextField } from "@opencode-ai/ui/text-field"
import { usePlatform } from "@/context/platform"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { DialogSelectDirectory } from "@/components/dialog-select-directory"
import { useServer } from "@/context/server"
import { base64Decode, base64Encode } from "@opencode-ai/util/encode"
import { useGlobalSync } from "@/context/global-sync"
import { ConversationList } from "./conversation-list"
import { getFilename } from "@opencode-ai/util/path"
import { Persist, persisted } from "@/utils/persist"
import { useCommand } from "@/context/command"
import { useConversation } from "@/context/conversation"
import { FolderManager, type FolderFilterKey } from "./folder-manager"

export function CadenceSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const platform = usePlatform()
  const dialog = useDialog()
  const server = useServer()
  const sync = useGlobalSync()
  const command = useCommand()
  const conversation = useConversation()

  const [ui, setUi] = persisted(
    Persist.global("cadence.sidebar", ["cadence.sidebar.v1"]),
    createStore({
      collapsed: false,
      query: "",
      filter: "all" as FolderFilterKey,
    }),
  )

  const activeDirectory = createMemo(() => (params.dir ? base64Decode(params.dir) : undefined))
  const activeWorkspace = createMemo(() => {
    const dir = activeDirectory()
    if (!dir) return
    return sync.child(dir)[0]
  })

  let searchInputRef: HTMLInputElement | undefined
  const focusSearch = () => {
    setUi("collapsed", false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        searchInputRef?.focus()
        searchInputRef?.select?.()
      })
    })
  }

  const navItems = createMemo(
    () =>
      [
        { label: "对话", href: "/chat", icon: "bubble-5" as const },
        { label: "搜索", href: "/chat/search", icon: "magnifying-glass" as const },
        { label: "工具", href: "/chat/tools", icon: "bullet-list" as const },
        { label: "设置", href: "/chat/settings", icon: "settings-gear" as const },
      ] as const,
  )

  const filteredSessions = createMemo(() => {
    const workspace = activeWorkspace()
    if (!workspace) return []
    const q = ui.query.trim().toLowerCase()
    let result = workspace.session

    if (ui.filter === "pinned") {
      result = result.filter((s) => !!conversation.metaFor({ directory: activeDirectory()!, sessionId: s.id })?.pinned)
    } else if (ui.filter.startsWith("folder:")) {
      const folderId = ui.filter.slice("folder:".length)
      result = result.filter(
        (s) => conversation.metaFor({ directory: activeDirectory()!, sessionId: s.id })?.folderId === folderId,
      )
    }

    if (!q) return result
    return result.filter((s) => (s.title || "未命名对话").toLowerCase().includes(q))
  })

  command.register(() => [
    {
      id: "cadence.chat.search",
      title: "搜索对话",
      description: "在当前项目中搜索对话标题",
      category: "Cadence",
      keybind: "mod+f",
      slash: "search",
      onSelect: focusSearch,
    },
  ])

  const primaryAction = createMemo(() => {
    if (activeDirectory() && params.dir) {
      return {
        label: "新对话",
        icon: "bubble-5" as const,
        onClick: () => navigate(`/chat/${params.dir}/session`),
      }
    }
    return {
      label: "打开项目",
      icon: "folder-add-left" as const,
      onClick: chooseProject,
    }
  })

  async function chooseProject() {
    function resolve(result: string | string[] | null) {
      const directory = Array.isArray(result) ? result[0] : result
      if (!directory) return
      navigate(`/chat/${base64Encode(directory)}/session`)
    }

    if (platform.openDirectoryPickerDialog && server.isLocal()) {
      const result = await platform.openDirectoryPickerDialog?.({
        title: "打开项目",
        multiple: false,
      })
      resolve(result)
    } else {
      dialog.show(() => <DialogSelectDirectory multiple={false} onSelect={resolve} />, () => resolve(null))
    }
  }

  const widthClass = createMemo(() => (ui.collapsed ? "w-[72px]" : "w-[288px]"))

  return (
    <aside class={["cadence-sidebar shrink-0", widthClass()].join(" ")}>
      <div class="h-12 px-3 flex items-center justify-between gap-2">
        <button
          type="button"
          class="size-9 rounded-md hover:bg-surface-raised-base-hover flex items-center justify-center"
          onClick={() => setUi("collapsed", (v) => !v)}
          aria-label="切换侧边栏"
        >
          <Icon name="chevron-double-right" size="small" classList={{ "rotate-180": !ui.collapsed }} />
        </button>

        <Show when={!ui.collapsed}>
          <div class="min-w-0 flex items-center gap-2">
            <div class="size-7 rounded-md border border-border-base bg-surface-base flex items-center justify-center">
              <Icon name="brain" size="small" />
            </div>
            <div class="text-14-medium truncate">Cadence</div>
          </div>
        </Show>

        <Button
          size="small"
          class="px-3"
          classList={{ "px-0 w-9 justify-center": ui.collapsed }}
          onClick={primaryAction().onClick}
        >
          <Show when={!ui.collapsed} fallback={<Icon name={primaryAction().icon} size="small" />}>
            {primaryAction().label}
          </Show>
        </Button>
      </div>

      <nav class="px-2 flex flex-col gap-1">
        <For each={navItems()}>
          {(item) => (
            <A
              href={item.href}
              class="cadence-nav-item flex items-center gap-2 px-2 h-9 rounded-md text-13-medium text-text-strong hover:bg-surface-raised-base-hover"
              data-active={
                location.pathname === item.href || location.pathname.startsWith(item.href + "/") ? "true" : "false"
              }
              classList={{
                "justify-center px-0": ui.collapsed,
              }}
            >
              <Icon name={item.icon} size="small" />
              <Show when={!ui.collapsed}>{item.label}</Show>
            </A>
          )}
        </For>
        <Button
          size="large"
          variant="ghost"
          class="w-full justify-start gap-2 px-2"
          classList={{ "justify-center px-0": ui.collapsed }}
          onClick={() => navigate("/")}
        >
          <Icon name="folder" size="small" />
          <Show when={!ui.collapsed}>项目</Show>
        </Button>
      </nav>

      <div class="mt-3 px-2">
        <Show when={!ui.collapsed}>
          <TextField
            value={ui.query}
            placeholder="搜索对话"
            class="w-full"
            onInput={(e) => setUi("query", e.currentTarget.value)}
            ref={(el) => {
              searchInputRef = el
            }}
          />
        </Show>

        <div class="px-1.5 py-2 text-12-medium text-text-weak">
          <Show when={!ui.collapsed} fallback={<Icon name="bubble-5" size="small" />}>
            最近对话
          </Show>
        </div>

        <Switch>
          <Match when={activeDirectory()}>
            <Show when={activeWorkspace()} keyed>
              {() => (
                <>
                  <FolderManager
                    directory={activeDirectory()!}
                    sessions={activeWorkspace()!.session}
                    collapsed={ui.collapsed}
                    filter={ui.filter}
                    onFilterChange={(filter) => setUi("filter", filter)}
                  />
                  <div class="mt-3 px-2">
                    <ConversationList
                      directory={activeDirectory()!}
                      sessions={filteredSessions()}
                      selectedId={params.id}
                      onSelect={(session) => navigate(`/chat/${params.dir}/session/${session.id}`)}
                    />
                  </div>
                </>
              )}
            </Show>
          </Match>
          <Match when={sync.data.project.length > 0}>
            <Show when={!ui.collapsed}>
              <div class="px-1.5 py-2 text-12-regular text-text-weak">
                先选择一个项目，然后这里会显示该项目的对话列表。
              </div>
            </Show>
            <ul class="flex flex-col gap-1">
              <For each={sync.data.project.slice(0, ui.collapsed ? 2 : 4)}>
                {(p) => (
                  <Button
                    size="large"
                    variant="ghost"
                    class="w-full justify-start px-2 text-13-regular"
                    classList={{ "justify-center px-0": ui.collapsed }}
                    onClick={() => navigate(`/chat/${base64Encode(p.worktree)}`)}
                  >
                    <Icon name="folder" size="small" />
                    <Show when={!ui.collapsed}>{getFilename(p.worktree)}</Show>
                  </Button>
                )}
              </For>
            </ul>
          </Match>
          <Match when={true}>
            <Show when={!ui.collapsed}>
              <div class="px-1.5 py-2 text-12-regular text-text-weak">
                暂无项目，先打开一个本地项目开始使用。
              </div>
            </Show>
            <Button size="large" class="w-full mt-2" onClick={chooseProject}>
              打开项目
            </Button>
          </Match>
        </Switch>
      </div>
    </aside>
  )
}
