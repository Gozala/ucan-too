import * as Server from "@ucanto/server"
import * as Capability from "../capabilities.js"
import * as Effect from "./effect.js"

export const info = Server.provide(Capability.Info, async ({ context }) => {
  return {
    ok: {
      id: context.id.did(),
      storage: process.env.WORKSHOP_STATE_STORE,
      state: await Effect.query(),
    },
  }
})
