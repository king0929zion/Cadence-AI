#!/usr/bin/env bun
import * as path from "node:path"
import * as fs from "node:fs/promises"

import { getCurrentSidecar, windowsify } from "./utils"

const desktopDir = path.resolve(import.meta.dir, "..")
const repoRoot = path.resolve(desktopDir, "..", "..")

const target = Bun.env.RUST_TARGET ?? "x86_64-pc-windows-msvc"

const sidecar = getCurrentSidecar(target)
const opencodeDir = path.join(repoRoot, "packages", "opencode")

const bun = process.execPath

const build = Bun.spawn(
  [bun, "run", "--cwd", opencodeDir, "build", "--single"],
  {
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
    },
  },
)
const exitCode = await build.exited
if (exitCode !== 0) {
  throw new Error(`Failed to build CLI binary (exit code ${exitCode})`)
}

const source = windowsify(path.join(opencodeDir, "dist", sidecar.ocBinary, "bin", "opencode"))
const sidecarsDir = path.join(desktopDir, "src-tauri", "sidecars")
await fs.mkdir(sidecarsDir, { recursive: true })

const dest = windowsify(path.join(sidecarsDir, `opencode-cli-${target}`))
await fs.copyFile(source, dest)

console.log(`Prepared sidecar: ${dest}`)

