import { Server, ok, error, Md5 } from "../deps.ts"
import * as Capability from "../capability/workshop.ts"
import * as Effect from "../effect.ts"

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
        md5: new Md5().update(capability.with).toString(),
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

export const name = Server.provide(
  Capability.Name,
  async ({ capability }) => {
    const { name } = capability.nb
    if (name.length > 32) {
      return error({
        message: `Your name "${name}" is too long, can you please use shorter one?`
      })
    } else {
      await Effect.update(capability.with, (state) => {
          return { ...state, name, score: state.name !== capability.with ? state.score + 5 : state.score }
      })
      return ok({})
    }
  })


