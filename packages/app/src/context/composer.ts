import { createStore } from "solid-js/store"
import { createSimpleContext } from "@opencode-ai/ui/context"
import { Persist, persisted } from "@/utils/persist"

type State = {
  pendingInsert: string | null
}

export const { use: useComposer, provider: ComposerProvider } = createSimpleContext({
  name: "Composer",
  init: () => {
    const [store, setStore] = persisted(
      Persist.global("cadence.composer", ["cadence.composer.v1"]),
      createStore<State>({
        pendingInsert: null,
      }),
    )

    const queueInsert = (content: string) => setStore("pendingInsert", content)

    const consumePendingInsert = () => {
      const content = store.pendingInsert
      if (!content) return null
      setStore("pendingInsert", null)
      return content
    }

    return {
      pendingInsert: () => store.pendingInsert,
      queueInsert,
      consumePendingInsert,
    }
  },
})

