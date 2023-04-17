import { Server, ok, error, } from "../deps.ts"
import * as Capability from "../capability/access.ts"
import * as Effect from "../effect.ts"
import { extract } from "../util.ts"



export const delegate = Server.provide(Capability.Delegate, async ({ capability, invocation }) => {
  const { ucan } = capability.nb
  const extracted = await extract(ucan)
  if (extracted.ok) {
    await Effect.achieve("delegated", capability.with)
    const delegation = extracted.ok
    const to = delegation.audience.did()
    return await Effect.send(to, ucan)
  }
  return ok({})
})

export const claim = Server.provide(Capability.Claim, async ({ capability, invocation }) => {
  const result = await Effect.receive(capability.with)
  if (result.ok) {
    if (capability.with !== invocation.issuer.did()) {
      await Effect.achieve("delegatedClaim", capability.with)
    } else {
      await Effect.achieve("claimed", capability.with)
    }
    return ok({ ucan: result.ok.messages })
  } else {
    return result
  }
})
