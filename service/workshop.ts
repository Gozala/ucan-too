import * as Server from "@ucanto/server"
import * as Capability from "../capabilities.ts"
import { ok, error } from "@ucanto/core"
import * as Effect from "./effect.ts"

export const enter = Server.provide(
  Capability.Enter,
  async ({ capability }) => {
    const position = await Effect.count() + 1
    const score =
      position == 1 ? 15 : position == 2 ? 10 : position == 3 ? 8 : 5
    
    try {
      const participant = {
        did: capability.with,
        name: capability.with,
        score,
        memo: {}
      }
      await Effect.put(participant)

      return ok(participant)
    } catch (cause) {
      return error({
          message: <string>cause.message
      })
    }
  }
)
