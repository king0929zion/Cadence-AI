import { useLocation, useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { TextField } from "@opencode-ai/ui/text-field"
import { RadioGroup } from "@opencode-ai/ui/radio-group"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { base64Decode, base64Encode } from "@opencode-ai/util/encode"
import { getFilename } from "@opencode-ai/util/path"
import { DateTime } from "luxon"
import { useGlobalSync } from "@/context/global-sync"
import { useConversation } from "@/context/conversation"

type Scope = "当前项目" | "全部项目"
type FolderFilter = "all" | "none" | string

function extractDirFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/chat\/([^/]+)(?:\/|$)/)
  if (!match?.[1]) return
  try {
    return base64Decode(match[1])
  } catch {
    return
  }
}

export default function ChatSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const sync = useGlobalSync()
  const conversation = useConversation()

  const returnTo = createMemo(() => {
    const params = new URLSearchParams(location.search ?? "")
    const target = params.get("return")
    if (target && target.startsWith("/")) return target
    return "/chat"
  })

  const activeDirectory = createMemo(() => extractDirFromPath(returnTo()) ?? sync.data.project.at(0)?.worktree)

  const [scope, setScope] = createSignal<Scope>("当前项目")
  const [query, setQuery] = createSignal("")
  const [pinnedOnly, setPinnedOnly] = createSignal(false)
  const [folderFilter, setFolderFilter] = createSignal<FolderFilter>("all")
  const [loadAllProjects, setLoadAllProjects] = createSignal(false)

  let queryInputRef: HTMLInputElement | undefined
  onMount(() => {
    requestAnimationFrame(() => queryInputRef?.focus())
  })

  const allProjectsSorted = createMemo(() => {
    return sync.data.project
      .slice()
      .toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
      .map((p) => p.worktree)
  })

  const directories = createMemo(() => {
    if (scope() === "当前项目") return activeDirectory() ? [activeDirectory()!] : []
    const list = allProjectsSorted()
    if (loadAllProjects()) return list
    return list.slice(0, 12)
  })

  createEffect(() => {
    for (const dir of directories()) sync.child(dir)
  })

  const results = createMemo(() => {
    const q = query().trim().toLowerCase()
    const pinned = pinnedOnly()
    const folder = folderFilter()

    const rows: Array<{
      directory: string
      sessionId: string
      title: string
      updated: number
      pinned?: boolean
      folderName?: string
    }> = []

    for (const dir of directories()) {
      const [workspace] = sync.child(dir)
      for (const s of workspace.session) {
        if (!s?.id) continue
        const title = s.title || "未命名对话"
        const meta = conversation.metaFor({ directory: dir, sessionId: s.id })
        if (pinned && !meta?.pinned) continue
        if (folder !== "all") {
          const f = meta?.folderId
          if (folder === "none" && f) continue
          if (folder !== "none" && f !== folder) continue
        }
        if (q && !title.toLowerCase().includes(q)) continue

        const folderId = meta?.folderId
        const folderName = folderId ? conversation.folderById().get(folderId)?.name : undefined
        rows.push({
          directory: dir,
          sessionId: s.id,
          title,
          updated: s.time?.updated ?? s.time?.created ?? 0,
          pinned: meta?.pinned,
          folderName,
        })
      }
    }

    return rows
      .toSorted((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
        return b.updated - a.updated
      })
      .slice(0, q ? 200 : 80)
  })

  const folderLabel = createMemo(() => {
    const v = folderFilter()
    if (v === "all") return "全部文件夹"
    if (v === "none") return "未分类"
    return conversation.folderById().get(v)?.name ?? "文件夹"
  })

  const currentProjectLabel = createMemo(() => {
    const dir = activeDirectory()
    if (!dir) return "未选择项目"
    return `当前项目：${getFilename(dir)}`
  })

  const projectHint = createMemo(() => {
    if (scope() !== "全部项目") return
    const total = allProjectsSorted().length
    const loaded = directories().length
    if (total <= loaded) return
    return `当前仅加载最近 ${loaded}/${total} 个项目的会话列表。`
  })

  return (
    <div class="cadence-page min-h-0 flex-1 overflow-auto">
      <div class="mx-auto w-full max-w-5xl px-5 py-10">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="cadence-title text-24-semibold text-text-strong">搜索</div>
            <div class="mt-1 text-14-regular text-text-weak">跨项目查找对话（默认按标题搜索）。</div>
          </div>
          <Button size="large" variant="secondary" onClick={() => navigate(returnTo())}>
            <Icon name="arrow-left" size="small" />
            返回
          </Button>
        </div>

        <div class="mt-6 cadence-card p-5">
          <div class="flex flex-col gap-3">
            <div class="flex flex-col md:flex-row md:items-center gap-3">
              <TextField
                value={query()}
                placeholder="输入关键字（标题搜索）"
                class="w-full"
                ref={(el) => {
                  queryInputRef = el
                }}
                onInput={(e) => setQuery(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault()
                    navigate(returnTo())
                    return
                  }
                  if (e.key === "Enter") {
                    const first = results().at(0)
                    if (!first) return
                    e.preventDefault()
                    navigate(`/chat/${base64Encode(first.directory)}/session/${first.sessionId}`)
                  }
                }}
              />
              <RadioGroup
                size="small"
                options={["当前项目", "全部项目"] as Scope[]}
                current={scope()}
                onSelect={(v) => v && setScope(v)}
              />
              <DropdownMenu>
                <DropdownMenu.Trigger as={Button} variant="secondary" class="justify-between gap-2">
                  <span class="truncate max-w-[9rem]">{folderLabel()}</span>
                  <Icon name="chevron-down" size="small" class="text-text-weak" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content class="min-w-[220px]">
                    <DropdownMenu.Item onSelect={() => setFolderFilter("all")}>
                      <DropdownMenu.ItemLabel>全部文件夹</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onSelect={() => setFolderFilter("none")}>
                      <DropdownMenu.ItemLabel>未分类</DropdownMenu.ItemLabel>
                    </DropdownMenu.Item>
                    <Show when={conversation.folders().length > 0}>
                      <DropdownMenu.Separator />
                      <For each={conversation.folders()}>
                        {(f) => (
                          <DropdownMenu.Item onSelect={() => setFolderFilter(f.id)}>
                            <DropdownMenu.ItemLabel>{f.name}</DropdownMenu.ItemLabel>
                          </DropdownMenu.Item>
                        )}
                      </For>
                    </Show>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu>
              <button
                type="button"
                class="h-9 px-3 rounded-md border text-13-medium"
                classList={{
                  "border-text-interactive-base bg-surface-info-base/20": pinnedOnly(),
                  "border-border-weak-base bg-surface-base hover:bg-surface-raised-base-hover": !pinnedOnly(),
                }}
                onClick={() => setPinnedOnly((v) => !v)}
              >
                仅置顶
              </button>
            </div>

            <div class="flex items-center justify-between gap-3 text-12-regular text-text-weak">
              <div class="min-w-0 truncate">{currentProjectLabel()}</div>
              <Show when={folderFilter() !== "all" || pinnedOnly() || query().trim()}>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => {
                    setFolderFilter("all")
                    setPinnedOnly(false)
                    setQuery("")
                  }}
                >
                  清除筛选
                </Button>
              </Show>
            </div>

            <Show when={projectHint()}>
              {(hint) => (
                <div class="flex items-center justify-between gap-3 text-12-regular text-text-weak">
                  <div class="min-w-0 truncate">{hint()}</div>
                  <Button size="small" variant="secondary" onClick={() => setLoadAllProjects(true)}>
                    加载全部项目
                  </Button>
                </div>
              )}
            </Show>
          </div>
        </div>

        <div class="mt-6">
          <div class="flex items-center justify-between gap-3">
            <div class="text-13-medium text-text-strong">结果</div>
            <div class="text-12-regular text-text-weak">{results().length} 条</div>
          </div>

          <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <For each={results()}>
              {(row) => (
                <Button
                  size="large"
                  variant="ghost"
                  class="cadence-list-item justify-between px-3"
                  onClick={() => navigate(`/chat/${base64Encode(row.directory)}/session/${row.sessionId}`)}
                >
                  <div class="min-w-0 flex flex-col items-start gap-0.5">
                    <div class="min-w-0 flex items-center gap-2 max-w-full">
                      <div class="text-14-medium text-text-strong truncate">{row.title}</div>
                      <Show when={row.pinned}>
                        <div class="cadence-chip h-6 px-2 text-11-medium text-text-weak">置顶</div>
                      </Show>
                      <Show when={row.folderName}>
                        {(name) => <div class="cadence-chip h-6 px-2 text-11-medium text-text-weak">{name()}</div>}
                      </Show>
                    </div>
                    <div class="text-12-regular text-text-weak truncate max-w-full">{getFilename(row.directory)}</div>
                  </div>
                  <div class="shrink-0 text-12-regular text-text-weak">
                    {DateTime.fromMillis(row.updated).toRelative() ?? ""}
                  </div>
                </Button>
              )}
            </For>
          </div>

          <Show when={results().length === 0}>
            <div class="mt-6 cadence-card p-6">
              <div class="text-14-medium text-text-strong">没有结果</div>
              <div class="mt-1 text-12-regular text-text-weak">
                试试换个关键词；或切换到“全部项目”；也可以在侧边栏里用 Ctrl/Cmd+F 搜索当前项目。
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
