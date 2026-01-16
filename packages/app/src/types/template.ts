export type TemplateCategory = "写作" | "翻译" | "总结" | "分析" | "办公" | "其他"

export type TemplateModel = {
  id: string
  title: string
  description?: string
  category: TemplateCategory | string
  content: string
  createdAt?: number
  updatedAt?: number
}

