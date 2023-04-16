import * as API from "./api.ts"
import { ok, error, sha256, CAR, CBOR } from "@ucanto/core"
import { DB } from "https://deno.land/x/sqlite/mod.ts"

const store = new DB("workshop.db")
store.execute(`CREATE TABLE IF NOT EXISTS workshop (
    did TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    score INTEGER NOT NULL,
    memo BLOB
  )`)

export const count = async () => {
  const [row] = await store.query("SELECT COUNT(*) FROM workshop")
  return <number> row[0]
}

export const put = async (data: API.Participant) => {
  await store.query(
    "INSERT OR IGNORE INTO workshop (did, name, score, memo) VALUES (?, ?, ?, ?)",
    [data.did, data.name, data.score, CBOR.encode(data.memo)]
  )
}

export const update = async (
  did: string,
  update: (state: API.Participant) => API.Participant
) => {
  const [state] = await store.query(
    "SELECT name, score, memo FROM workshop WHERE did = ?",
    [did]
  )
  const [name, score, blob] = <[string, number, Uint8Array]>state
  const memo = CBOR.decode(blob || CBOR.encode({}))
  const next = update({ did, name, score, memo })

  await store.query(
    "UPDATE workshop SET name = ?, score = ?, memo = ? WHERE did = ?",
    [next.name, next.score, CBOR.encode(next.memo), did])
}

export const query = async () => {
  const entries = []
  for await (const row of store.query("SELECT did, name, score, memo FROM workshop ORDER BY score DESC")) {
    const [did, name, score, memo] = <[string, string, number, Uint8Array]>row
    entries.push({
      did,
      name,
      score,
      memo: decodeMemo(memo),
    })
  }

  return entries
}

const decodeMemo = (memo: Uint8Array = CBOR.encode({})) => {
  try {
    return CBOR.decode(memo)
  } catch (error) {
    return { message: <string>error.message}
  }
}

export const subscribe = async function* () {
  while (true) {
    yield await query()
    await sleep(1000)
    yield await query()
  }

  return undefined
}


export const resource = (path:string) => {
  const url = new URL(`../resource${path}`, import.meta.url)
  console.log("🫣", url.href)
  return Deno.readFile(url)
    .then(bytes => ok({ url: url, bytes }))
    .catch(error)
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
