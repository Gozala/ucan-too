import { capability, Schema } from "../deps.ts"

export const Info = capability({
  can: "ucanto/info",
  with: Schema.did(),
  nb: Schema.struct({}),
})


export const Restart = capability({
  can: "ucanto/restart",
  with: Schema.did(),
})
