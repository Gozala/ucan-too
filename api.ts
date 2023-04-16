export * from "https://cdn.skypack.dev/@ucanto/interface"

export type Model = Array<Team | Tombstone>

export interface Team {
  name: Name
  members: Set<DID>
  score: number

  memo: Record<string, unknown>
}

export type Tombstone = null

export type Name = string
export type DID = string
