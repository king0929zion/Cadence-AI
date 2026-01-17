import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { showToast } from "@opencode-ai/ui/toast"
import { usePlatform } from "@/context/platform"
import { useServer } from "@/context/server"
import { useGlobalSync } from "@/context/global-sync"

function buildConfigPath(home?: string) {
  if (!home) return "~/.config/opencode/opencode.json"
  const sep = home.includes("\\") ? "\\" : "/"
  return `${home}${sep}.config${sep}opencode${sep}opencode.json`
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.style.position = "fixed"
      el.style.left = "-9999px"
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}

export function AboutPanel() {
  const platform = usePlatform()
  const server = useServer()
  const sync = useGlobalSync()

  const configPath = createMemo(() => buildConfigPath(sync.data.path.home))

  const open = (url: string) => {
    try {
      platform.openLink(url)
    } catch (err: any) {
      showToast({ title: "无法打开链接", description: err?.message ?? String(err) })
    }
  }

  const checkUpdate = async () => {
    if (!platform.checkUpdate) {
      showToast({ title: "当前平台不支持自动更新", description: "请前往 Releases 下载最新版本。" })
      return
    }
    try {
      const result = await platform.checkUpdate()
      if (!result.updateAvailable) {
        showToast({ title: "已是最新版本" })
        return
      }
      showToast({ title: "发现更新", description: result.version ? `最新版本：${result.version}` : "发现新版本" })
    } catch (err: any) {
      showToast({ title: "检查更新失败", description: err?.message ?? String(err) })
    }
  }

  const installUpdate = async () => {
    if (!platform.update) {
      showToast({ title: "当前平台不支持自动更新", description: "请前往 Releases 下载最新版本。" })
      return
    }
    try {
      await platform.update()
      showToast({ title: "更新已开始", description: "如有需要，请稍后重启应用。" })
    } catch (err: any) {
      showToast({ title: "安装更新失败", description: err?.message ?? String(err) })
    }
  }

  return (
    <div class="flex flex-col gap-4">
      <div class="cadence-card p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="text-14-medium text-text-strong">Cadence</div>
            <div class="mt-1 text-12-regular text-text-weak">
              对话式 AI 客户端。保留完整执行能力，但把体验聚焦在日常对话与可视化管理。
            </div>
          </div>
          <div class="flex gap-2">
            <Button variant="secondary" onClick={checkUpdate}>
              <Icon name="arrow-up" size="small" />
              检查更新
            </Button>
            <Button variant="secondary" onClick={installUpdate}>
              <Icon name="download" size="small" />
              安装更新
            </Button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div class="cadence-list-item px-3 py-3">
            <div class="text-12-regular text-text-weak">平台</div>
            <div class="mt-1 text-13-medium text-text-strong">{platform.platform}</div>
          </div>
          <div class="cadence-list-item px-3 py-3">
            <div class="text-12-regular text-text-weak">系统</div>
            <div class="mt-1 text-13-medium text-text-strong">{platform.os ?? "未知"}</div>
          </div>
          <div class="cadence-list-item px-3 py-3">
            <div class="text-12-regular text-text-weak">版本</div>
            <div class="mt-1 text-13-medium text-text-strong">{platform.version ?? "未知"}</div>
          </div>
        </div>
      </div>

      <div class="cadence-card p-5">
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <div class="text-14-medium text-text-strong">连接状态</div>
            <div class="mt-1 text-12-regular text-text-weak">当前使用的服务器与工作区信息。</div>
          </div>
          <div class="flex items-center gap-2">
            <div
              classList={{
                "size-2 rounded-full": true,
                "bg-icon-success-base": server.healthy() === true,
                "bg-icon-critical-base": server.healthy() === false,
                "bg-border-weak-base": server.healthy() === undefined,
              }}
            />
            <div class="text-13-medium text-text-strong truncate">{server.name}</div>
          </div>
        </div>
        <div class="mt-3 text-12-regular text-text-weak">
          <div class="truncate">服务器 URL：{server.url ?? "—"}</div>
          <div class="truncate">工作区：{sync.data.project.length}</div>
        </div>
      </div>

      <div class="cadence-card p-5">
        <div class="text-14-medium text-text-strong">下载与社区</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => open("https://github.com/king0929zion/Cadence-AI")}>
            <Icon name="github" size="small" />
            仓库
          </Button>
          <Button variant="secondary" onClick={() => open("https://github.com/king0929zion/Cadence-AI/releases")}>
            <Icon name="download" size="small" />
            Releases（下载）
          </Button>
          <Button variant="secondary" onClick={() => open("https://github.com/king0929zion/Cadence-AI/actions")}>
            <Icon name="bullet-list" size="small" />
            Actions（构建）
          </Button>
          <Button variant="secondary" onClick={() => open("https://github.com/king0929zion/Cadence-AI/issues")}>
            <Icon name="bubble-5" size="small" />
            Issues（反馈）
          </Button>
        </div>
      </div>

      <div class="cadence-card p-5">
        <div class="text-14-medium text-text-strong">配置文件</div>
        <div class="mt-1 text-12-regular text-text-weak">
          全局配置位于：<span class="font-mono">{configPath()}</span>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const ok = await copyToClipboard(configPath())
              showToast({ title: ok ? "已复制路径" : "复制失败", description: ok ? undefined : "当前环境不支持剪贴板写入。" })
            }}
          >
            <Icon name="copy" size="small" />
            复制路径
          </Button>
        </div>
        <div class="mt-2 text-12-regular text-text-weak">
          兼容提示：旧配置里若存在 <span class="font-mono">providers / agents / models</span> 等字段，Cadence 会自动迁移/忽略，不再阻塞启动。
        </div>
      </div>
    </div>
  )
}
