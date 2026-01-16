import { useGlobalSync } from "@/context/global-sync"
import { createMemo, For, Match, Show, Switch } from "solid-js"
import { Button } from "@opencode-ai/ui/button"
import { Logo } from "@opencode-ai/ui/logo"
import { useLayout } from "@/context/layout"
import { useNavigate } from "@solidjs/router"
import { base64Encode } from "@opencode-ai/util/encode"
import { Icon } from "@opencode-ai/ui/icon"
import { usePlatform } from "@/context/platform"
import { DateTime } from "luxon"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { DialogSelectDirectory } from "@/components/dialog-select-directory"
import { DialogSelectServer } from "@/components/dialog-select-server"
import { useServer } from "@/context/server"

export default function Home() {
  const sync = useGlobalSync()
  const layout = useLayout()
  const platform = usePlatform()
  const dialog = useDialog()
  const navigate = useNavigate()
  const server = useServer()
  const homedir = createMemo(() => sync.data.path.home)

  function openProjectCode(directory: string) {
    layout.projects.open(directory)
    navigate(`/${base64Encode(directory)}`)
  }

  function openProjectChat(directory: string) {
    layout.projects.open(directory)
    navigate(`/chat/${base64Encode(directory)}/session`)
  }

  async function chooseProject() {
    function resolve(result: string | string[] | null) {
      if (Array.isArray(result)) {
        for (const directory of result) {
          openProjectChat(directory)
        }
      } else if (result) {
        openProjectChat(result)
      }
    }

    if (platform.openDirectoryPickerDialog && server.isLocal()) {
      const result = await platform.openDirectoryPickerDialog?.({
        title: "打开项目",
        multiple: true,
      })
      resolve(result)
    } else {
      dialog.show(
        () => <DialogSelectDirectory multiple={true} onSelect={resolve} />,
        () => resolve(null),
      )
    }
  }

  return (
    <div class="cadence-page min-h-0">
      <div class="mx-auto mt-32 w-full md:w-auto px-4">
        <Logo class="md:w-xl opacity-10" />
        <Button
          size="large"
          variant="ghost"
          class="mt-4 mx-auto text-14-regular text-text-weak"
          onClick={() => dialog.show(() => <DialogSelectServer />)}
        >
          <div
            classList={{
              "size-2 rounded-full": true,
              "bg-icon-success-base": server.healthy() === true,
              "bg-icon-critical-base": server.healthy() === false,
              "bg-border-weak-base": server.healthy() === undefined,
            }}
          />
          {server.name}
        </Button>

        <div class="mt-10 mx-auto w-full max-w-3xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="cadence-title text-24-semibold text-text-strong">Cadence</div>
              <div class="mt-1 text-14-regular text-text-weak">
                对话式日常 AI 客户端（保留完整 OpenCode 执行能力）。
              </div>
            </div>
            <div class="flex gap-2">
              <Button size="large" onClick={() => navigate("/chat")}>
                <Icon name="bubble-5" size="small" />
                进入对话
              </Button>
              <Button size="large" variant="secondary" onClick={chooseProject}>
                <Icon name="folder-add-left" size="small" />
                打开项目
              </Button>
            </div>
          </div>
        </div>
        <Switch>
          <Match when={sync.data.project.length > 0}>
            <div class="mt-10 mx-auto w-full max-w-3xl flex flex-col gap-4">
              <div class="flex gap-2 items-center justify-between pl-1">
                <div class="text-14-medium text-text-strong">最近项目</div>
                <Button icon="folder-add-left" size="normal" class="pl-2 pr-3" onClick={chooseProject}>
                  打开项目
                </Button>
              </div>
              <ul class="flex flex-col gap-2">
                <For
                  each={sync.data.project
                    .toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
                    .slice(0, 5)}
                >
                  {(project) => (
                    <div class="flex gap-2 items-center">
                      <Button
                        size="large"
                        variant="ghost"
                        class="flex-1 text-14-mono text-left justify-between px-3"
                        onClick={() => openProjectChat(project.worktree)}
                      >
                        {project.worktree.replace(homedir(), "~")}
                        <div class="text-14-regular text-text-weak">
                          {DateTime.fromMillis(project.time.updated ?? project.time.created).toRelative()}
                        </div>
                      </Button>
                      <Button
                        size="large"
                        variant="secondary"
                        class="px-3"
                        onClick={() => openProjectCode(project.worktree)}
                      >
                        <Icon name="layout-right" size="small" />
                        编程
                      </Button>
                    </div>
                  )}
                </For>
              </ul>
            </div>
          </Match>
          <Match when={true}>
            <div class="mt-16 mx-auto flex flex-col items-center gap-3">
              <Icon name="folder-add-left" size="large" />
              <div class="flex flex-col gap-1 items-center justify-center">
                <div class="text-14-medium text-text-strong">暂无最近项目</div>
                <div class="text-12-regular text-text-weak">打开一个本地项目后即可开始。</div>
              </div>
              <div />
              <Button class="px-3" onClick={chooseProject}>
                打开项目
              </Button>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  )
}
