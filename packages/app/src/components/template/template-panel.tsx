import { createMemo, For } from "solid-js"
import { createStore } from "solid-js/store"
import { TextField } from "@opencode-ai/ui/text-field"
import { TemplateCard } from "./template-card"
import type { TemplateModel } from "@/types/template"

export function TemplatePanel(props: { templates: TemplateModel[]; onUse: (t: TemplateModel) => void }) {
  const [store, setStore] = createStore({
    query: "",
    category: "全部",
  })

  const categories = createMemo(() => {
    const set = new Set(props.templates.map((t) => t.category))
    return ["全部", ...Array.from(set).toSorted()]
  })

  const filtered = createMemo(() => {
    const q = store.query.trim().toLowerCase()
    return props.templates.filter((t) => {
      if (store.category !== "全部" && t.category !== store.category) return false
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
      )
    })
  })

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <TextField
          value={store.query}
          placeholder="搜索模板（标题/内容）"
          class="w-full md:w-96"
          onInput={(e) => setStore("query", e.currentTarget.value)}
        />
        <div class="flex gap-2 flex-wrap">
          <For each={categories()}>
            {(c) => (
              <button
                class="h-8 px-3 rounded-md border border-border-weak-base text-12-medium"
                classList={{
                  "bg-surface-base-active text-text-strong": store.category === c,
                  "bg-surface-base text-text-weak hover:bg-surface-raised-base-hover": store.category !== c,
                }}
                onClick={() => setStore("category", c)}
              >
                {c}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <For each={filtered()}>{(t) => <TemplateCard template={t} onUse={props.onUse} />}</For>
      </div>
    </div>
  )
}
