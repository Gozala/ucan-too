import { capability, Schema } from "../deps.ts"
import { bytes } from "../util.ts"



export const Delegate = capability({
  can: "access/delegate",
  with: Schema.did(),
  nb: Schema.struct({
    ucan: bytes()
  }),
})

export const Claim = capability({
  can: "access/claim",
  with: Schema.did()
})
