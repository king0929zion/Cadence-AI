import { For, Show, createMemo, createSignal } from "solid-js"
import type { Session } from "@opencode-ai/sdk/v2/client"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { DropdownMenu } from "@opencode-ai/ui/dropdown-menu"
import { Dialog } from "@opencode-ai/ui/dialog"
import { TextField } from "@opencode-ai/ui/text-field"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useConversation } from "@/context/conversation"

export type FolderFilterKey = "all" | "pinned" | `folder:${string}`

export function FolderManager(props: {
  directory: string
  sessions: Session[]
  collapsed: boolean
  filter: FolderFilterKey
  onFilterChange: (key: FolderFilterKey) => void
}) {
  const dialog = useDialog()
  const conversation = useConversation()

  const keyFor = (sessionId: string) => ({ directory: props.directory, sessionId })

  const countFor = (filter: FolderFilterKey) => {
    if (filter === "all") return props.sessions.length
    if (filter === "pinned")
      return props.sessions.filter((s) => !!conversation.metaFor(keyFor(s.id))?.pinned).length
    if (filter.startsWith("folder:")) {
      const folderId = filter.slice("folder:".length)
      return props.sessions.filter((s) => conversation.metaFor(keyFor(s.id))?.folderId === folderId).length
    }
    return 0
  }

  const isActive = (filter: FolderFilterKey) => props.filter === filter

  const activeFolderExists = createMemo(() => {
    if (!props.filter.startsWith("folder:")) return true
    const id = props.filter.slice("folder:".length)
    return conversation.folders().some((f) => f.id === id)
  })

  const [expanded, setExpanded] = createSignal(true)

  const openFolderDialog = (opts: { title: string; initial?: string; onSubmit: (name: string) => void }) => {
    dialog.show(() => {
      const [name, setName] = createSignal(opts.initial ?? "")

      const submit = () => {
        const value = name().trim()
        if (!value) return
        opts.onSubmit(value)
        dialog.close()
      }

      return (
        <Dialog
          title={opts.title}
          action={<IconButton type="button" icon="close" variant="ghost" onClick={() => dialog.close()} />}
        >
          <div class="flex flex-col gap-3">
            <TextField
              autofocus
              value={name()}
              placeholder="输入文件夹名称"
              onInput={(e: InputEvent & { currentTarget: HTMLInputElement }) => setName(e.currentTarget.value)}
              onKeyDown={(e: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
                if (e.key === "Enter") submit()
              }}
            />
            <div class="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => dialog.close()}>
                取消
              </Button>
              <Button onClick={submit}>保存</Button>
            </div>
          </div>
        </Dialog>
      )
    })
  }

  const folders = createMemo(() => conversation.folders().slice().toSorted((a, b) => a.name.localeCompare(b.name)))

  return (
    <Show when={!props.collapsed}>
      <div class="mt-3 px-2">
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="flex items-center gap-2 text-12-medium text-text-weak hover:text-text-base"
            onClick={() => setExpanded((v) => !v)}
          >
            <Icon name={expanded() ? "chevron-down" : "chevron-right"} size="small" />
            文件夹
          </button>
          <IconButton
            type="button"
            icon="plus-small"
            variant="ghost"
            aria-label="新建文件夹"
            onClick={() =>
              openFolderDialog({
                title: "新建文件夹",
                onSubmit: (name) => {
                  const id = conversation.upsertFolder({ name })
                  props.onFilterChange(`folder:${id}`)
                },
              })
            }
          />
        </div>

        <Show when={expanded()}>
          <Show when={activeFolderExists()} fallback={<div class="text-12-regular text-text-weak px-2">文件夹已删除</div>}>
            <div class="mt-2 flex flex-col gap-1">
              <Button
                size="large"
                variant="ghost"
                class="w-full justify-between px-2"
                data-selected={isActive("all") ? "true" : "false"}
                onClick={() => props.onFilterChange("all")}
              >
                <span class="text-13-regular">全部对话</span>
                <span class="text-12-regular text-text-weak">{countFor("all")}</span>
              </Button>

              <Button
                size="large"
                variant="ghost"
                class="w-full justify-between px-2"
                data-selected={isActive("pinned") ? "true" : "false"}
                onClick={() => props.onFilterChange("pinned")}
              >
                <span class="text-13-regular">置顶</span>
                <span class="text-12-regular text-text-weak">{countFor("pinned")}</span>
              </Button>

              <For each={folders()}>
                {(folder) => (
                  <div class="group flex items-center gap-1">
                    <Button
                      size="large"
                      variant="ghost"
                      class="w-full justify-between px-2"
                      data-selected={isActive(`folder:${folder.id}`) ? "true" : "false"}
                      onClick={() => props.onFilterChange(`folder:${folder.id}`)}
                    >
                      <span class="min-w-0 truncate text-13-regular">{folder.name}</span>
                      <span class="shrink-0 text-12-regular text-text-weak">{countFor(`folder:${folder.id}`)}</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenu.Trigger
                        as={IconButton}
                        icon="dots-horizontal"
                        variant="ghost"
                        class="shrink-0 size-8 rounded-md opacity-0 group-hover:opacity-100 data-[expanded]:opacity-100 data-[expanded]:bg-surface-base-active"
                        aria-label="文件夹菜单"
                      />
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content class="mt-1">
                          <DropdownMenu.Item
                            onSelect={() =>
                              openFolderDialog({
                                title: "重命名文件夹",
                                initial: folder.name,
                                onSubmit: (name) => conversation.upsertFolder({ id: folder.id, name }),
                              })
                            }
                          >
                            <DropdownMenu.ItemLabel>重命名</DropdownMenu.ItemLabel>
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            onSelect={() => {
                              const ok = window.confirm(`删除文件夹「${folder.name}」？该文件夹下的对话会移回“全部”。`)
                              if (!ok) return
                              if (props.filter === `folder:${folder.id}`) props.onFilterChange("all")
                              conversation.removeFolder(folder.id)
                            }}
                          >
                            <DropdownMenu.ItemLabel>删除</DropdownMenu.ItemLabel>
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </Show>
  )
}
