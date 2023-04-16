import { ed25519 } from "@ucanto/principal"
import { sha256, CBOR } from "@ucanto/core"
import * as Server from "@ucanto/server"
import * as service from "./service.js"
import * as CAR from "@ucanto/transport/car"
import * as Effect from "./service/effect.js"
import * as API from "./service/api.js"
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
}


const seed = "ipfs-thing workshop 2019"
const secret = await sha256.digest(new TextEncoder().encode(seed))
const principal = await ed25519.derive(secret.digest)
const server = Server.create({
  id: principal,
  service,
  codec: CAR.inbound,
})

/**
 * @param {any} message
 */
export const message = message => {}

/**
 * @param {Request} request
 */
export const fetch = async request => {
  console.log(`⏪ ${request.method} ${new URL(request.url).pathname}`)
  switch (request.method) {
    case "POST":
      return post(request)
    case "GET":
      return get(request)
    case "HEAD":
      return head()
    case "OPTIONS":
      return options()
    default:
      return new Response(`Method ${request.method} is not supported`, {
        status: 405,
        headers: CORS,
      })
  }
}

/**
 *
 * @param {Request} request
 */
const post = async request => {
  const bytes = new Uint8Array(await request.arrayBuffer())
  
  console.log(CBOR.decode(CAR.codec.decode(bytes).roots[0].bytes))

  const response = await server.request({
    headers: Object.fromEntries(request.headers.entries()),
    body: bytes,
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      ...CORS,
      ...response.headers,
    },
  })
}

/**
 *
 * @param {Request} request
 */
const get = async request => {
  const url = new URL(request.url)
  switch (url.pathname) {
    case "/.well-known/did.json": {
      const serviceEndpoint = new URL("/", url)
      serviceEndpoint.hostname = "localhost"

      return new Response(
        JSON.stringify(
          {
            "@context": ["https://www.w3.org/ns/did/v1"],
            alsoKnownAs: server.id.did(),
            service: [
              {
                id: server.id.did(),
                type: "ucanto",
                serviceEndpoint: serviceEndpoint.href,
              },
            ],
          },
          null,
          2
        ),
        {
          headers: {
            ...CORS,
            "content-type": "application/json",
          },
        }
      )
    }
    case "/event-stream": {
      return events()
    }
    case "/stream": {
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      writer.write("hello")
      writer.close()
      return new Response(readable, {
        headers: CORS
      })
    }
    case "/":
      return new Response(
        renderLeaderBoard({
          did: server.id.did(),
          state: await Effect.query(),
        }),
        {
          headers: {
            ...CORS,
            "content-type": "text/html",
          },
        }
      )
    default:
      return resource(url)
  }
}

const head = () => {
  return new Response(null, {
    status: 200,
    headers: {
      ...CORS,
      "content-type": "text/plain",
      "x-did": server.id.did(),
    },
  })
}

const options = () => {
  return new Response(null, {
    status: 200,
    headers: {
      ...CORS,
      "content-type": "text/plain",
      "x-did": server.id.did(),
    },
  })
}


const events = () => {
  const { readable, writable } = new TransformStream()
  const pipe = async () => {
    const writer = writable.getWriter()
    const state = await Effect.query()
    writer.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`)
    for await (const state of Effect.subscribe()) {
      writer.write(`event: change\ndata: ${JSON.stringify(state)}\n\n`)
    }
  }

  pipe()

  return new Response(readable, {
    headers: {
      ...CORS,
      "content-type": "text/event-stream",
      "cache-control": "no-store",
    },
  })
}

/**
 * @param {URL} url
 */
const resource = async ({ pathname }) => {
  const result = await Effect.resource(pathname)
  const resource = result.ok ? result : await Effect.resource("/404.html")
  if (resource.ok) {
    return new Response(resource.ok.bytes, {
      status: 200,
      headers: { 
        ...CORS,
        "content-type": contentTypeOf(resource.ok.url.href) },
    })
  } else {
    return new Response("Not Found", {
      status: 404,
      headers: { ...CORS, "content-type": "text/plain" },
    })
  }
}

/**
 * @param {{did:string, state: API.Model}} state
 * @returns
 */
const renderLeaderBoard = ({ did, state }) => `<html>
  <head>
    <title>Leaderboard</title>
    <script src="/main.js" type="module"></script>
  </head>
  <body>
  <h1>Leaderboard</h1>
  <p>Provider DID: ${did}</p>
  <ul id="board">
  ${Object.entries(state)
    .map(([name, participant]) => `<li>${name}</li>`)
    .join("\n")}
  </ul>
  </body>
</html>`

/**
 * @param {string} path
 */
const contentTypeOf = path => {
  if (path.endsWith(".css")) return "text/css"
  if (path.endsWith(".js")) return "application/javascript"
  if (path.endsWith(".png")) return "image/png"
  if (path.endsWith(".svg")) return "image/svg+xml"
  if (path.endsWith(".html")) return "text/html"
  return "text/plain"
}
