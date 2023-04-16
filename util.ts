import { Schema, CAR, CBOR, Delegation, API, UCAN, ok, error } from "./deps.ts"
export const bytes = () =>
  Schema.unknown().refine({
    read(value) {
      if (value instanceof Uint8Array) {
        return ok(value)
      } else {
        return Schema.typeError({ expect: "Uint8Array", actual: value })
      }
    },
  })

const BRANCH = `ucan@${UCAN.VERSION}`
export const extract = async (archive: Uint8Array) => {
  try {
    const { roots, blocks } = CAR.codec.decode(archive)
    const [head] = roots
    const { bytes } = <{bytes: Uint8Array}> blocks.get(`${head.cid}`)
    const descriptor = <Record<string, API.UCANLink>>CBOR.decode(bytes)
    const root = descriptor[BRANCH]
    const view = await Delegation.view({ root, blocks })
    if (view) {
      return ok(view)
    } else {
      return error(new Error("Invalid archive"))
    }
  } catch (cause) {
    return error(cause)
  }
}

export const archive = async (delegation: API.Delegation) => {
  try {
    const blocks = new Map();
    for (const block of delegation.iterateIPLDBlocks()) {
      blocks.set(`${block.cid}`, block)
    }

    const root = await CBOR.write({
      [BRANCH]: delegation.root.cid,
    })
    blocks.set(`${root.cid}`, root)

    const bytes = CAR.codec.encode({
      roots: [root],
      blocks: blocks
    })

    return { ok: bytes }
  } catch (error) {
    return { error }
  }
}
