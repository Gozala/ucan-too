import { capability, Schema } from "../deps.ts"

const AgentDID = Schema.did({ method: "key" })
export const Enter = capability({
  can: "workshop/enter",
  with: AgentDID,
})

export const Name = capability({
  can: "workshop/name",
  with: AgentDID,
  nb: Schema.struct({
    name: Schema.string(),
  }),
})

export const Paint = capability({
  can: "workshop/paint",
  with: AgentDID,
  nb: Schema.struct({
    color: Schema.string(),
  })
})

export const Conspire = capability({
  can: "workshop/conspire",
  with: AgentDID,
})
