import { Component, Show } from "solid-js"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { popularProviders, useProviders } from "@/hooks/use-providers"
import { Dialog } from "@opencode-ai/ui/dialog"
import { List } from "@opencode-ai/ui/list"
import { Tag } from "@opencode-ai/ui/tag"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { IconName } from "@opencode-ai/ui/icons/provider"
import { DialogConnectProvider } from "./dialog-connect-provider"

export const DialogSelectProvider: Component = () => {
  const dialog = useDialog()
  const providers = useProviders()

  return (
    <Dialog title="连接提供商">
      <List
        search={{ placeholder: "搜索提供商", autofocus: true }}
        activeIcon="plus-small"
        key={(x) => x?.id}
        items={providers.all}
        filterKeys={["id", "name"]}
        groupBy={(x) => (popularProviders.includes(x.id) ? "热门" : "其他")}
        sortBy={(a, b) => {
          if (popularProviders.includes(a.id) && popularProviders.includes(b.id))
            return popularProviders.indexOf(a.id) - popularProviders.indexOf(b.id)
          return a.name.localeCompare(b.name)
        }}
        sortGroupsBy={(a, b) => {
          if (a.category === "热门" && b.category !== "热门") return -1
          if (b.category === "热门" && a.category !== "热门") return 1
          return 0
        }}
        onSelect={(x) => {
          if (!x) return
          dialog.show(() => <DialogConnectProvider provider={x.id} />)
        }}
      >
        {(i) => (
          <div class="px-1.25 w-full flex items-center gap-x-3">
            <ProviderIcon data-slot="list-item-extra-icon" id={i.id as IconName} />
            <span>{i.name}</span>
            <Show when={i.id === "opencode"}>
              <Tag>推荐</Tag>
            </Show>
            <Show when={i.id === "anthropic"}>
              <div class="text-14-regular text-text-weak">可使用 Claude Pro/Max 或 API Key 连接</div>
            </Show>
          </div>
        )}
      </List>
    </Dialog>
  )
}
