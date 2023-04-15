export * from "@ucanto/interface"

export interface Model {
  [key: Name]: Participant
}

export interface Participant {
  did: string
  score: number
}

export type Name = string
