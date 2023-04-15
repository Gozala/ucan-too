import { capability, Schema } from "@ucanto/validator"

const Agent = Schema.did({ method: "key" })

export const WorkshopHello = capability({
  can: "workshop/hello",
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
