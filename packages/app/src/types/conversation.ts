export type ConversationFolder = {
  id: string
  name: string
  createdAt: number
}

export type ConversationKey = {
  directory: string
  sessionId: string
}

export type ConversationMeta = {
  key: ConversationKey
  folderId?: string
  pinned?: boolean
  updatedAt?: number
}

