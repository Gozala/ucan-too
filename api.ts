export * from "https://cdn.skypack.dev/@ucanto/interface"

export type Model = Participant[]

export interface Participant {
  name: string
  did: string
  score: number

  memo: unknown
}

export type Name = string
