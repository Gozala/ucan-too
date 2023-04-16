import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import * as API from "./api.ts"
import { ed25519 } from "@ucanto/principal"
import { sha256 } from "@ucanto/core"
import * as Server from "@ucanto/server"
import { CAR } from "@ucanto/transport"
import * as Effect from "./service/effect.ts"
import * as service from "./service.ts"

const seed = "ipfs-thing workshop 2019"
const secret = await sha256.digest(new TextEncoder().encode(seed))
const principal = await ed25519.derive(secret.digest)
const server = Server.create({
  id: principal,
  service,
  codec: CAR.inbound,
})





/**
 * @param {Request} request
 */
export const fetch = (request: Request) => {
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
      })
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


export const post = async (request: Request) => {
  const response = await server.request({
    headers: Object.fromEntries(request.headers.entries()),
    body: new Uint8Array(await request.arrayBuffer()),
  })

  return new Response(response.body, {
    headers: {
      ...CORS,
      ...response.headers,
    }
  })
}


export const get = (request: Request) => {
  const url = new URL(request.url)
  switch (url.pathname) {
    case "/.well-known/did.json":
      return did(request)
    case "/event-stream": {
      return events(request)
    }
    case "/":
      return leaderboard(request)
    default:
      return resource(request)
  }
}

export const did = (request: Request) => {
  return new Response(
    JSON.stringify(
      {
        "@context": ["https://www.w3.org/ns/did/v1"],
        alsoKnownAs: server.id.did(),
        service: [
          {
            id: server.id.did(),
            type: "ucanto",
            serviceEndpoint: new URL("/", request.url).href,
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



export const events = (_: Request) => {
  const events = Effect.subscribe()

  const body = new ReadableStream({
    async start(controller) {
      for await (const event of events) {
        const chunk = new TextEncoder().encode(
          `event: change\ndata: ${JSON.stringify(event)}\n\n`
        )
        controller.enqueue(chunk)
      }
    },
    cancel() {
      events.return(undefined)
    },
  })

  return new Response(body, {
    headers: {
      ...CORS,
      "content-type": "text/event-stream",
      "cache-control": "no-store",
    },
  })
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
}

export const leaderboard = async (_: Request) => {
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
}


const renderLeaderBoard = ({ did, state }: { did:string, state: API.Model }) => `<html>
  <head>
    <title>Leaderboard</title>
    <script src="/main.js" type="module"></script>
  </head>
  <body>
  <h1>Leaderboard</h1>
  <p>Provider DID: ${did}</p>
  <ul id="board">
  ${state
    .map(({name, score}) => `<li>${name} - ${score} ⭐️</li>`)
    .join("\n")}
  </ul>
  </body>
</html>`

/**
 * @param {string} path
 */
const contentTypeOf = (path:string) => {
  if (path.endsWith(".css")) return "text/css"
  if (path.endsWith(".js")) return "application/javascript"
  if (path.endsWith(".png")) return "image/png"
  if (path.endsWith(".svg")) return "image/svg+xml"
  if (path.endsWith(".html")) return "text/html"
  return "text/plain"
}


const resource = async (request: Request) => {
  const pathname = new URL(request.url).pathname
  const result = await Effect.resource(pathname)
  const resource = result.ok ? result : await Effect.resource("/404.html")
  if (resource.ok) {
    return new Response(resource.ok.bytes, {
      status: 200,
      headers: { 
        ...CORS,
        "content-type": contentTypeOf(resource.ok.url.href)
      },
    })
  } else {
    return new Response("Not Found", {
      status: 404,
      headers: { 
        ...CORS,
        "content-type": "text/plain"
      },
    })
  }
}
export const store = (_: Request) => {
  return new Response("Not Implemented", {
    status: 501,
    headers: {
      ...CORS,
    },
  })
}

serve(fetch)
