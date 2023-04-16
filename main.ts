import { serve, API, ed25519, sha256, Server, CAR } from "./deps.ts"
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
    },
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

const renderLeaderBoard = ({
  did,
  state,
}: {
  did: string
  state: API.Model
}) => `<!doctype html>
<html>
  <head>
    <title>Leaderboard</title>
    <link rel="stylesheet" href="/tachyons.min.css">
    <script src="/main.js" type="module"></script>
  </head>
  <body class="w-100 sans-serif ma3">
  <nav class="pa3 pa4-ns">
    <a class="link dim black b f1 f-headline-ns tc db mb3 mb4-ns" href="/">Leaderboard</a>
    <div class="tc pb3">
      <span class="link gray f6 f5-ns dib mr3">Provider DID: </span><code class="code bg-black-10">${did}</code>
    </div>
  </nav>
  <div id="board" class="mw8 center">
    ${state
      .map(({ did, name, score, md5 }) => {
        return `<article class="dt w-100 bb b--black-05 pb2 mt2">
  <div class="dtc w2 w3-ns v-mid">
    <img src="https://www.gravatar.com/avatar/${md5}?d=retro" class="ba b--black-10 db br2 w2 w3-ns h2 h3-ns"/>
  </div>
  <div class="dtc v-mid pl3">
    <h1 class="f6 f5-ns fw6 lh-title black mv0">${name === did ? "No Name" : name}</h1>
    <h2 class="f6 fw4 mt0 mb0 black-60 code">${did}</h2>
  </div>
  <div class="dtc v-mid tr">
    <span class="f4 dib h2 w2 br-100 pa2 bg-near-white ba b--black-10 tc lh-copy">${score}</span>
  </div>
</article>`
      })
      .join("\n")}
  </div>
  </body>
</html>`

/**
 * @param {string} path
 */
const contentTypeOf = (path: string) => {
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
        "content-type": contentTypeOf(resource.ok.url.href),
      },
    })
  } else {
    return new Response("Not Found", {
      status: 404,
      headers: {
        ...CORS,
        "content-type": "text/plain",
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
