import { Server } from "../deps.ts"
import * as Capability from "../capabilities.ts"
import * as Effect from "./effect.ts"

export const info = Server.provide(Capability.Info, async ({ context }) => {
  return {
    ok: {
      id: context.id.did(),
      state: await Effect.query(),
    },
  }
})
