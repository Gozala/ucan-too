import { capability, Schema } from "./deps.ts"

const Participant = Schema.did({ method: "key" })

export const Enter = capability({
  can: "workshop/enter",
  with: Participant
})

export const Name = capability({
  can: "workshop/name",
  with: Participant,
  nb: Schema.struct({
    name: Schema.string()
  })
})

export const Info = capability({
  can: "provider/info",
  with: Participant,
  nb: Schema.struct({}),
})

export const Conspire = capability({
  can: "workshop/conspire",
  with: Participant,
})
