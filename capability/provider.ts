import { capability, Schema } from "../deps.ts"

export const Info = capability({
  can: "provider/info",
  with: Schema.did(),
  nb: Schema.struct({}),
})
