import { createMemo } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { Persist, persisted } from "@/utils/persist"
import type { TemplateModel } from "@/types/template"

const BUILTIN_TEMPLATES: TemplateModel[] = [
  {
    id: "write.blog",
    title: "写作：文章大纲",
    description: "给一个主题，生成结构清晰的文章大纲（含小标题与要点）。",
    category: "写作",
    content: "请为主题「{主题}」生成一份文章大纲：包含标题、导语、3-5个小节标题与每节要点，并给出结尾总结。",
  },
  {
    id: "translate",
    title: "翻译：中英互译（保留格式）",
    description: "翻译并保留原有 Markdown/列表/代码块格式。",
    category: "翻译",
    content: "请将以下内容翻译为{目标语言}，保持原有格式不变，并在必要处给出术语对照：\n\n{内容}",
  },
  {
    id: "summarize",
    title: "总结：要点+行动项",
    description: "将长文压缩成关键结论与下一步行动。",
    category: "总结",
    content: "请对以下内容进行总结：\n1) 3-7条要点\n2) 关键结论\n3) 可执行的行动项（含优先级）\n\n{内容}",
  },
  {
    id: "analyze",
    title: "分析：利弊权衡",
    description: "对一个选择进行结构化分析并给出建议。",
    category: "分析",
    content: "请对「{问题}」做结构化分析：背景/目标/可选方案/每个方案利弊/风险与缓解/建议结论。",
  },
  {
    id: "email",
    title: "邮件：专业且简洁",
    description: "生成一封语气得体、信息完整的邮件。",
    category: "办公",
    content: "请根据以下信息写一封邮件：收件人角色={收件人}，目的={目的}，背景={背景}，需要对方做的事={请求}，截止时间={截止}。语气专业简洁。",
  },
  {
    id: "meeting",
    title: "会议纪要：结论驱动",
    description: "输出结论、决定与负责人。",
    category: "办公",
    content: "请把下面的会议记录整理为纪要：结论/决定/待办（负责人+截止）/风险与阻塞/下次会议议题。\n\n{记录}",
  },
]

type State = {
  custom: TemplateModel[]
  pendingInsert: string | null
}

export const { use: useTemplate, provider: TemplateProvider } = createSimpleContext({
  name: "Template",
  init: () => {
    const [store, setStore] = persisted(
      Persist.global("cadence.template", ["cadence.template.v1"]),
      createStore<State>({
        custom: [],
        pendingInsert: null,
      }),
    )

    const all = createMemo(() => [...BUILTIN_TEMPLATES, ...store.custom])

    const upsertCustom = (input: TemplateModel) => {
      const now = Date.now()
      const next: TemplateModel = {
        ...input,
        category: input.category || "其他",
        updatedAt: now,
        createdAt: input.createdAt ?? now,
      }

      setStore(
        "custom",
        produce((draft) => {
          const index = draft.findIndex((t) => t.id === next.id)
          if (index === -1) draft.unshift(next)
          else draft[index] = next
        }),
      )
    }

    const removeCustom = (id: string) => setStore("custom", (items) => items.filter((t) => t.id !== id))

    const queueInsert = (content: string) => setStore("pendingInsert", content)

    const consumePendingInsert = () => {
      const content = store.pendingInsert
      if (!content) return null
      setStore("pendingInsert", null)
      return content
    }

    return {
      builtin: () => BUILTIN_TEMPLATES,
      custom: () => store.custom,
      templates: all,
      pendingInsert: () => store.pendingInsert,
      upsertCustom,
      removeCustom,
      queueInsert,
      consumePendingInsert,
    }
  },
})

