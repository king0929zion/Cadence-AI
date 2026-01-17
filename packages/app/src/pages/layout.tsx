import { Match, Switch, type ParentProps } from "solid-js"
import { useLocation } from "@solidjs/router"
import CodeLayout from "@/pages/code-layout"
import ChatLayout from "@/pages/chat-layout"

function isCadenceChatRoute(pathname: string) {
  return (
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname === "/settings" ||
    pathname === "/templates" ||
    pathname === "/chat/tools" ||
    pathname === "/chat/settings"
  )
}

export default function Layout(props: ParentProps) {
  const location = useLocation()
  return (
    <Switch>
      <Match when={isCadenceChatRoute(location.pathname)}>
        <ChatLayout>{props.children}</ChatLayout>
      </Match>
      <Match when={true}>
        <CodeLayout>{props.children}</CodeLayout>
      </Match>
    </Switch>
  )
}
