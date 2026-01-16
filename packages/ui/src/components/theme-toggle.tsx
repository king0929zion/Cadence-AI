import { createMemo } from "solid-js"
import { IconButton } from "./icon-button"
import { useTheme, type ColorScheme } from "../theme/context"

const ORDER: ColorScheme[] = ["system", "light", "dark"]

export function ThemeToggle(props: { class?: string }) {
  const theme = useTheme()
  const next = createMemo(() => {
    const current = theme.colorScheme()
    const idx = ORDER.indexOf(current)
    return ORDER[(idx + 1 + ORDER.length) % ORDER.length]
  })

  const icon = createMemo(() => {
    const current = theme.colorScheme()
    if (current === "light") return "layout-bottom" as const
    if (current === "dark") return "layout-bottom-full" as const
    return "layout-bottom-partial" as const
  })

  return (
    <IconButton
      class={props.class}
      icon={icon()}
      variant="ghost"
      onClick={() => theme.setColorScheme(next())}
      aria-label="Toggle theme"
    />
  )
}
