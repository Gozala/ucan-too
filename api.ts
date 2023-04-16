export * from "https://esm.sh/@ucanto/interface@7.0.1"

export type Model = Participant[]

export interface Participant {
  name: string
  did: string
  score: number
  md5: string
  memo: Record<string, any>
}

export type Name = string
