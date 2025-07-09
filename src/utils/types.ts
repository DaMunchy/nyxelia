

export type MessageImage = {
  data: string
  mimeType: string
  name?: string
  ext?: string
}

export type Message = {
  role: 'user' | 'model'
  text?: string
  image?: MessageImage
}

export type UserProfile = {
  name?: string
  bio?: string
  nyx?: string
  namenyx?: string
}

export type GeminiContentPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
