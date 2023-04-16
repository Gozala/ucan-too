import { Server, ok, error } from "../deps.ts"
import * as Capability from "../capabilities.ts"
import * as Effect from "./effect.ts"

export const enter = Server.provide(
  Capability.Enter,
  async ({ capability }) => {
    const position = await Effect.count() + 1
    const score =
      position == 1 ? 15 : position == 2 ? 10 : position == 3 ? 8 : 5
    
    try {
      const participant = {
        members: new Set([capability.with]),
        name: capability.with,
        score,
        memo: {}
      }
      await Effect.set(capability.with, participant)

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
      return ok(await Effect.update(capability.with, (state) => {
        const score = state.name === capability.with ? state.score + 5 : state.score
          
        return { ...state, name, score }
      }))
    }
  })

export const conspire = Server.provide(
  Capability.Conspire,
  async ({ capability, invocation }) => {
    if (capability.with === invocation.issuer.did()) {
      return error({
        message: "You can't conspire with yourself, come on just talk to a person next to you!"
      })
    } else {
      const peer = await Effect.get(capability.with)
      if (!peer) {
        return error({
          message: "You can't conspire with someone who is not in the workshop!"
        })
      } else {
        return ok(await Effect.update(capability.with, (state) => {
          const score = state.score + peer.score
          return { ...state, score }
        }))
      }
    }
  })

