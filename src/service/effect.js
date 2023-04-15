import * as API from "@ucanto/interface"
import * as FS from "node:fs/promises"
import * as SyncFS from "node:fs"
import { ok, error, sha256, CAR, CBOR } from "@ucanto/core"

/**
 * @template {{}} T
 * @param {(state: T) => T} update
 * @param {T} init
 */
export const commit = async (update, init) => {
  const base = new URL(process.env.WORKSHOP_STATE_STORE ?? "")
  const STATE = new URL("./state.cbor", base)

  const file = await FS.open(STATE, "a+")
  let content = await file.readFile()
  await file.close()

  while (true) {
    const cid = await CBOR.link(content)
    const state = await update(
      content.length === 0 ? init : CBOR.decode(content)
    )
    const buffer = SyncFS.readFileSync(STATE)
    const current = await CBOR.link(buffer)
    if (cid.toString() !== current.toString()) {
      content = buffer
    } else {
      SyncFS.writeFileSync(STATE, await CBOR.encode(state))
      return state
    }
  }
}

export const query = async () => {
  console.log(process.env.WORKSHOP_STATE_STORE)
  const base = new URL(process.env.WORKSHOP_STATE_STORE ?? "")
  const STATE = new URL("./state.cbor", base)

  const file = await FS.open(STATE, "a+")
  const content = await file.readFile()
  await file.close()
  return content.length === 0 ? {} : CBOR.decode(content)
}

export const subscribe = async function* () {
  const base = new URL(process.env.WORKSHOP_STATE_STORE ?? "")
  const STATE = new URL("./state.cbor", base)
  for await (const event of FS.watch(STATE)) {
    yield await query()
  }
}

/**
 * @param {string} path
 */
export const resource = path => {
  const url = new URL(`../../resource${path}`, import.meta.url)
  console.log("🫣", url.href)
  return FS.readFile(url)
    .then(bytes => ok({ url: url, bytes }))
    .catch(error)
}
