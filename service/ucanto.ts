import { Server, panic, error, ok } from "../deps.ts"
import * as Capability from "../capability/ucanto.ts"
import * as Effect from "../effect.ts"
import { fromDSL } from "../schema.ts"

export const info = Server.provide(Capability.Info, async ({ context }) => {
  try {
    const content = await Effect.resource("/schema.ipldsch")
    if (!content.ok) {
      panic(content.error.message)
    }

    const source = new TextDecoder().decode(content.ok.bytes)
    return ok({
      ...fromDSL(source),
      id: context.id.did()
    })
  } catch (cause) {
    return error(<Error>cause)
  }
})


