import { Server, ok, error, API } from "../deps.ts"
import * as Capability from "../capability/workshop.ts"
import * as Effect from "../effect.ts"

export const enter = Server.provide(
  Capability.Enter,
  async ({ capability }) => {    
    try {
      const player = await Effect.add({
        name: capability.with,
        paint: "",
        style: "",
        inbox: [],
        store: {},
      })
      return ok(player)
    } catch (cause) {
      return error({
          message: <string>cause.message
      })
    }
  }
)

export const name = Server.provide(
  Capability.Name,
  async ({ capability, invocation }) => {
    const { name } = capability.nb
    console.log("update name to", name)
    if (name.length > 32) {
      return error({
        message: `Your name "${name}" is too long, can you please use shorter one?`
      })
    } else {
      await Effect.achieve("named", capability.with)
      if (capability.with !== invocation.issuer.did()) {
        await Effect.achieve("delegatedName", capability.with)
        await Effect.achieve("invokedName", invocation.issuer.did())
      }
      await Effect.update(capability.with, (state) => {
          return { ...state, name }
      })

      return ok({})
    }
  })


export const paint = Server.provide(Capability.Paint, async ({ capability, invocation }) => {
  const { color } = capability.nb
  if (color.length > 32) {
    return error({
      message: `You supposed to supply paint color, what kind of color is "${name}" ?`,
    })
  } else {
    await Effect.achieve("painted", capability.with)
    if (capability.with !== invocation.issuer.did()) {
      await Effect.achieve("delegatedPaint", capability.with)
      await Effect.achieve("invokedPaint", invocation.issuer.did())
    }
    await Effect.update(capability.with, state => {
      return { ...state, paint: color }
    })

    return ok({})
  }
})


