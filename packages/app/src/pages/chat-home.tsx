import { For, createEffect, createMemo } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { useGlobalSync } from "@/context/global-sync"
import { base64Encode } from "@opencode-ai/util/encode"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import type { Session } from "@opencode-ai/sdk/v2/client"
import { DateTime } from "luxon"
import { getFilename } from "@opencode-ai/util/path"

type SessionRow = {
  directory: string
  session: Session
}

export default function ChatHome() {
  const sync = useGlobalSync()
  const navigate = useNavigate()

  const recentDirectories = createMemo(() => {
    return sync.data.project
      .toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
      .slice(0, 5)
      .map((p) => p.worktree)
  })

  createEffect(() => {
    for (const dir of recentDirectories()) {
      sync.child(dir)
    }
  })

  const recentSessions = createMemo(() => {
    const rows: SessionRow[] = []
    for (const dir of recentDirectories()) {
      const [store] = sync.child(dir)
      for (const session of store.session) {
        rows.push({ directory: dir, session })
      }
    }

    return rows
      .filter((r) => !!r.session?.id)
      .toSorted((a, b) => (b.session.time?.updated ?? b.session.time?.created ?? 0) - (a.session.time?.updated ?? 0))
      .slice(0, 12)
  })

  return (
    <div class="cadence-page min-h-0 flex-1 overflow-auto">
      <div class="mx-auto w-full max-w-5xl px-5 py-10">
        <div class="cadence-card cadence-card-strong p-6 md:p-8">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div class="text-12-regular uppercase tracking-[0.2em] text-text-weak">Cadence</div>
              <div class="mt-2 cadence-title text-24-semibold text-text-strong">今天想做点什么？</div>
              <div class="mt-2 text-14-regular text-text-weak">
                对话式 AI 助手，保留完整执行能力，把重点放在日常使用体验。
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                size="large"
                onClick={() => {
                  const dir = recentDirectories()[0]
                  if (!dir) {
                    navigate("/")
                    return
                  }
                  navigate(`/chat/${base64Encode(dir)}/session`)
                }}
              >
                <Icon name="bubble-5" size="small" />
                新对话
              </Button>
              <Button size="large" variant="secondary" onClick={() => navigate("/chat/templates")}>
                <Icon name="dot-grid" size="small" />
                模板库
              </Button>
            </div>
          </div>
        </div>

        <div class="mt-8">
          <div class="flex items-center justify-between">
            <div class="text-13-medium text-text-strong">最近对话</div>
            <Button variant="ghost" size="small" onClick={() => navigate("/")}>
              <Icon name="folder" size="small" />
              管理项目
            </Button>
          </div>

          <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <For each={recentSessions()}>
              {(row) => (
                <Button
                  size="large"
                  variant="ghost"
                  class="cadence-list-item justify-between px-3"
                  onClick={() => navigate(`/chat/${base64Encode(row.directory)}/session/${row.session.id}`)}
                >
                  <div class="min-w-0 flex flex-col items-start gap-0.5">
                    <div class="text-14-medium text-text-strong truncate max-w-full">
                      {row.session.title || "未命名对话"}
                    </div>
                    <div class="text-12-regular text-text-weak truncate max-w-full">{getFilename(row.directory)}</div>
                  </div>
                  <div class="shrink-0 text-12-regular text-text-weak">
                    {DateTime.fromMillis(row.session.time?.updated ?? row.session.time?.created ?? 0).toRelative() ?? ""}
                  </div>
                </Button>
              )}
            </For>
          </div>

          <div class="mt-6 cadence-card p-4">
            <div class="text-14-medium text-text-strong">快捷入口</div>
            <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button size="large" variant="secondary" class="justify-start" onClick={() => navigate("/chat/templates")}>
                <Icon name="dot-grid" size="small" />
                写作 / 翻译 / 总结模板
              </Button>
              <Button size="large" variant="secondary" class="justify-start" onClick={() => navigate("/chat/settings")}>
                <Icon name="settings-gear" size="small" />
                主题与快捷键
              </Button>
              <Button size="large" variant="secondary" class="justify-start" onClick={() => navigate("/")}>
                <Icon name="folder-add-left" size="small" />
                打开项目
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
