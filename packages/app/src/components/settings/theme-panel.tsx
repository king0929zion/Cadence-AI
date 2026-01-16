import { For, createMemo } from "solid-js"
import { useTheme, type ColorScheme } from "@opencode-ai/ui/theme"

const OPTIONS: { value: ColorScheme; label: string; description: string }[] = [
  { value: "system", label: "跟随系统", description: "根据系统深浅色自动切换" },
  { value: "light", label: "浅色", description: "始终使用浅色模式" },
  { value: "dark", label: "深色", description: "始终使用深色模式" },
]

export function ThemePanel() {
  const theme = useTheme()
  const active = createMemo(() => theme.colorScheme())

  return (
    <div class="flex flex-col gap-3">
      <div>
        <div class="text-14-medium text-text-strong">主题</div>
        <div class="mt-1 text-12-regular text-text-weak">深色/浅色/跟随系统</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <For each={OPTIONS}>
          {(opt) => (
            <button
              class="p-3 rounded-md border text-left"
              classList={{
                "border-text-interactive-base bg-surface-info-base/20": active() === opt.value,
                "border-border-weak-base bg-surface-base hover:bg-surface-raised-base-hover": active() !== opt.value,
              }}
              onClick={() => theme.setColorScheme(opt.value)}
            >
              <div class="text-13-medium text-text-strong">{opt.label}</div>
              <div class="mt-1 text-12-regular text-text-weak">{opt.description}</div>
            </button>
          )}
        </For>
      </div>
    </div>
  )
}

