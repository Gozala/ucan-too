import { capability, Schema } from "./import.ts"

const Agent = Schema.did({ method: "key" })

export const Enter = capability({
  can: "workshop/enter",
  with: Agent,
  nb: Schema.struct({
    name: Schema.string(),
  }),
})

export const Info = capability({
  can: "provider/info",
  with: Agent,
  nb: Schema.struct({}),
})
