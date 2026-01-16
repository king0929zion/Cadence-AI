import { createMemo } from "solid-js"
import { createStore, produce } from "solid-js/store"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { Persist, persisted } from "@/utils/persist"
import type { ConversationFolder, ConversationMeta } from "@/types/conversation"

type State = {
  folders: ConversationFolder[]
  meta: ConversationMeta[]
}

export const { use: useConversation, provider: ConversationProvider } = createSimpleContext({
  name: "Conversation",
  init: () => {
    const [store, setStore] = persisted(
      Persist.global("cadence.conversation", ["cadence.conversation.v1"]),
      createStore<State>({
        folders: [],
        meta: [],
      }),
    )

    const folderById = createMemo(() => new Map(store.folders.map((f) => [f.id, f])))

    const upsertFolder = (input: { id?: string; name: string }) => {
      const now = Date.now()
      const id = input.id ?? crypto.randomUUID()
      setStore(
        "folders",
        produce((draft) => {
          const idx = draft.findIndex((f) => f.id === id)
          const next: ConversationFolder = { id, name: input.name, createdAt: draft[idx]?.createdAt ?? now }
          if (idx === -1) draft.unshift(next)
          else draft[idx] = next
        }),
      )
      return id
    }

    const removeFolder = (id: string) => {
      setStore("folders", (items) => items.filter((f) => f.id !== id))
      setStore(
        "meta",
        produce((draft) => {
          for (const m of draft) {
            if (m.folderId === id) delete m.folderId
          }
        }),
      )
    }

    const setConversationFolder = (key: { directory: string; sessionId: string }, folderId?: string) => {
      const now = Date.now()
      setStore(
        "meta",
        produce((draft) => {
          const idx = draft.findIndex((m) => m.key.directory === key.directory && m.key.sessionId === key.sessionId)
          const next: ConversationMeta = { key, folderId, updatedAt: now }
          if (idx === -1) draft.unshift(next)
          else draft[idx] = { ...draft[idx], ...next }
        }),
      )
    }

    return {
      folders: () => store.folders,
      meta: () => store.meta,
      folderById,
      upsertFolder,
      removeFolder,
      setConversationFolder,
    }
  },
})

