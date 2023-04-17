
import { API, ok, error, CBOR } from "./deps.ts"


// export const activateDB = () => {
//   const store = new DB("workshop.db")
//   store.execute(`CREATE TABLE IF NOT EXISTS workshop (
//       did TEXT PRIMARY KEY,
//       name TEXT NOT NULL UNIQUE,
//       score INTEGER NOT NULL,
//       memo BLOB
//     )`)

//   return store
// }
// const store = activateDB()


const init = (): API.Model => ({
  players: new Map(),
  achievements: {
    named: [],
    delegatedName: [],
    invokedName: [],
    painted: [],
    delegatedPaint: [],
    invokedPaint: [],
    delegated: [],
    claimed: [],
    delegatedClaim: [],
  },
})

export const db = init()

export const add = async (player: API.Player) => {
  if (!db.players.has(player.name)) {
    db.players.set(player.name, player)
    return player
  }
  return await <API.Player>db.players.get(player.name)
}

export const achieve = async (achievement: keyof API.Achievements, did:API.AgentDID) => {
  if (!db.achievements[achievement].includes(did)) {
    db.achievements[achievement].push(did)
    return await true
  }
  return await false
}

export const send = async (did: API.AgentDID, message: Uint8Array) => {
  const player = db.players.get(did)
  if (!player) {
    return error({ message: `Player ${did} has not enter workshop, please choose a audience that did` })
  } else {
    player.inbox.push(message)
    return await ok({})
  }
}

export const receive = async (did: API.AgentDID, limit=10) => {
  const player = db.players.get(did)
  if (!player) {
    return error({ message: `Player ${did} has not enter workshop, please enter first if you want participate` })
  } else {
    const messages = []
    for (const [key, message] of player.inbox.entries()) {
      messages.push(message)
      if (messages.length >= limit) {
        break
      }
    }
    player.inbox.splice(0, messages.length)
    return await ok({ messages })
  }
}


export const update = async (
  did: string,
  update: (state: API.Player) => API.Player
) => {
  const { players } = db
  const player = players.get(did)
  if (!player) {
    throw new Error(`Player ${did} has not entered competition`)
  }

  const state = update(player)


  await players.set(did, state)

  return state
}

export const query = async () => {
  const entries = <API.Rating[]>[]
  for (const [did, player] of db.players.entries()) {
    entries.push({
      player,
      did,
      score: calculateScore(did, db.achievements),
    })
  }
  
  return await entries
}

const calculateScore = (did:API.AgentDID, achievements: API.Achievements) => {
  let score = 0
  for (const rating of Object.values(achievements)) {
    const position = rating.indexOf(did) + 1
    const award = position === 0
      ? 0
      : position === 1
      ? 15
      : position === 2
      ? 12
      : position === 3
      ? 9
      : 5
    score += award
  }

  return score
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
  const url = new URL(`./resource${path}`, import.meta.url)
  console.log("🫣", url.href)
  return Deno.readFile(url)
    .then(bytes => ok({ url: url, bytes }))
    .catch(cause => error(<Error>cause))
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
