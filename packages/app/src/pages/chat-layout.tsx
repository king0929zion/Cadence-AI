import { type ParentProps } from "solid-js"
import { useCommand } from "@/context/command"
import { useLocation, useNavigate } from "@solidjs/router"
import { CadenceSidebar } from "@/components/chat/sidebar"

export default function ChatLayout(props: ParentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const command = useCommand()

  command.register(() => [
    {
      id: "cadence.chat.home",
      title: "回到对话首页",
      description: "打开 Cadence 对话首页",
      category: "Cadence",
      slash: "chat",
      suggested: true,
      onSelect: () => navigate("/chat"),
    },
    {
      id: "cadence.templates",
      title: "打开模板库",
      description: "选择提示词模板并插入输入框",
      category: "Cadence",
      slash: "templates",
      suggested: true,
      onSelect: () => navigate(`/chat/templates?return=${encodeURIComponent(location.pathname)}`),
    },
    {
      id: "cadence.settings",
      title: "打开设置",
      description: "主题、快捷键与通用设置",
      category: "Cadence",
      slash: "settings",
      onSelect: () => navigate("/chat/settings"),
    },
    {
      id: "cadence.projects",
      title: "打开项目列表",
      description: "回到项目/服务器选择页",
      category: "Cadence",
      slash: "projects",
      onSelect: () => navigate("/"),
    },
  ])

  return (
    <div class="size-full flex cadence-shell cadence-ambient">
      <CadenceSidebar />
      <main class="min-w-0 flex-1 flex flex-col">{props.children}</main>
    </div>
  )
}
