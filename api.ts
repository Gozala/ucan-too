export * from "https://esm.sh/@ucanto/interface@7.0.1"

export interface Model {
  players: Map<AgentDID, Player>

  achievements: Achievements
}

export interface Achievements {
  // order in which players named their player
  named: AgentDID[]
  delegatedName: AgentDID[]
  invokedName: AgentDID[]

  // painted player frame
  painted: AgentDID[]

  // delegated paint
  delegatedPaint: AgentDID[]
  invokedPaint: AgentDID[]

  // delegated capability
  delegated: AgentDID[]
  // claimed delegation
  claimed: AgentDID[]
  delegatedClaim: AgentDID[]
}


export interface Player {
  
  name: string
  paint: string

  style: string

  inbox: Uint8Array[]

  store: Record<string, unknown>
}

export interface Rating {
  did: AgentDID
  score: number
  player: Player
}

export type Name = string
export type AgentDID = string
