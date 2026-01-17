import type { ParentProps } from "solid-js"
import { useLocation, useNavigate, useParams } from "@solidjs/router"
import { useCommand } from "@/context/command"
import { CadenceSidebar } from "@/components/chat/sidebar"

export default function ChatLayout(props: ParentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const command = useCommand()

  command.register(() => [
    {
      id: "cadence.chat.new",
      title: "新建对话",
      description: "在当前项目中创建一个新对话",
      category: "Cadence",
      keybind: "mod+n",
      onSelect: () => {
        if (params.dir) navigate(`/chat/${params.dir}/session`)
        else navigate("/chat")
      },
    },
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
      id: "cadence.tools",
      title: "打开工具中心",
      description: "常用入口、会话管理与更多可视化能力",
      category: "Cadence",
      keybind: "mod+t",
      slash: "tools",
      suggested: true,
      onSelect: () => navigate(`/chat/tools?return=${encodeURIComponent(location.pathname)}`),
    },
    {
      id: "cadence.search",
      title: "全局搜索",
      description: "跨项目搜索对话（优先标题）",
      category: "Cadence",
      keybind: "mod+shift+f",
      slash: "find",
      onSelect: () => navigate(`/chat/search?return=${encodeURIComponent(location.pathname)}`),
    },
    {
      id: "cadence.settings",
      title: "打开设置",
      description: "主题、快捷键与通用设置",
      category: "Cadence",
      slash: "settings",
      keybind: "mod+comma",
      onSelect: () => navigate("/chat/settings"),
    },
    {
      id: "cadence.about",
      title: "关于 Cadence",
      description: "版本、更新与链接",
      category: "Cadence",
      slash: "about",
      onSelect: () => navigate("/chat/about"),
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
