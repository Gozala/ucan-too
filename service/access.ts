import { Server, ok, error, } from "../deps.ts"
import * as Capability from "../capability/access.ts"
import { mailboxes } from "../effect.ts"
import { extract } from "../util.ts"



export const delegate = Server.provide(Capability.Delegate, async ({ capability }) => {
  const { ucan } = capability.nb
  const result = await extract(ucan)
  if (result.ok) {
    const delegation = result.ok
    const to = delegation.audience.did()
    let inbox = mailboxes.get(to)
    if (!inbox) {
      inbox = new Map()
      mailboxes.set(to, inbox)
    }
    inbox.set(`${delegation.root.cid}`, ucan)
  }
  return ok({})
})

export const claim = Server.provide(Capability.Claim, ({ capability }) => {
  const inbox = mailboxes.get(capability.with)
  if (inbox) {
    const ucans = []
    for (const [key, message] of inbox.entries()) {
      inbox.delete(key)
      ucans.push(message)
      if (ucans.length >= 10) {
        break
      }
    }

    return ok({ ucans })
  } else {
    return ok({ ucans: [] })
  }
})
