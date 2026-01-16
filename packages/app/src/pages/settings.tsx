import { createStore } from "solid-js/store"
import { Match, Switch } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { ThemePanel } from "@/components/settings/theme-panel"
import { ShortcutsPanel } from "@/components/settings/shortcuts-panel"
import { GeneralPanel } from "@/components/settings/general-panel"

type Tab = "general" | "theme" | "shortcuts"

export default function Settings() {
  const navigate = useNavigate()
  const [store, setStore] = createStore<{ tab: Tab }>({ tab: "theme" })

  return (
    <div class="min-h-0 flex-1 overflow-auto">
      <div class="mx-auto w-full max-w-4xl px-4 py-10">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-24-semibold text-text-strong">设置</div>
            <div class="mt-1 text-14-regular text-text-weak">主题、快捷键与通用偏好。</div>
          </div>
          <Button size="large" variant="secondary" onClick={() => navigate("/chat")}>
            <Icon name="bubble-5" size="small" />
            返回对话
          </Button>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <button
            class="h-9 px-3 rounded-md border text-13-medium"
            classList={{
              "border-text-interactive-base bg-surface-info-base/20": store.tab === "theme",
              "border-border-weak-base bg-surface-base hover:bg-surface-raised-base-hover": store.tab !== "theme",
            }}
            onClick={() => setStore("tab", "theme")}
          >
            主题
          </button>
          <button
            class="h-9 px-3 rounded-md border text-13-medium"
            classList={{
              "border-text-interactive-base bg-surface-info-base/20": store.tab === "shortcuts",
              "border-border-weak-base bg-surface-base hover:bg-surface-raised-base-hover": store.tab !== "shortcuts",
            }}
            onClick={() => setStore("tab", "shortcuts")}
          >
            快捷键
          </button>
          <button
            class="h-9 px-3 rounded-md border text-13-medium"
            classList={{
              "border-text-interactive-base bg-surface-info-base/20": store.tab === "general",
              "border-border-weak-base bg-surface-base hover:bg-surface-raised-base-hover": store.tab !== "general",
            }}
            onClick={() => setStore("tab", "general")}
          >
            通用
          </button>
        </div>

        <div class="mt-6">
          <Switch>
            <Match when={store.tab === "theme"}>
              <ThemePanel />
            </Match>
            <Match when={store.tab === "shortcuts"}>
              <ShortcutsPanel />
            </Match>
            <Match when={true}>
              <GeneralPanel />
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  )
}
