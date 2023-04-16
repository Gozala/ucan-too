export * from "https://cdn.skypack.dev/@ucanto/interface"

export type Model = Participant[]

export interface Participant {
  name: string
  did: string
  score: number
  md5: string
  memo: Record<string, any>
}

export type Name = string
