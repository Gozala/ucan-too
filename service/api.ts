export * from "https://esm.sh/@ucanto/interface"

export interface Model {
  [key: Name]: Participant
}

export interface Participant {
  did: string
  name: string
  score: number

  memo: unknown
}

export type Name = string
