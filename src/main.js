import { Worker, isMainThread, parentPort } from "node:worker_threads"

/**
 *
 * @param {object} input
 * @param {number} [input.port]
 * @param {URL|null} [input.storage]
 */
const supervise = async ({ port = 8000, storage = null } = {}) => {
  const { createServer } = await import("node:http")
  const { networkInterfaces, tmpdir } = await import("node:os")
  const { pathToFileURL } = await import("node:url")
  const { Readable } = await import("stream")
  storage = storage ?? new URL("workshop-store", pathToFileURL(tmpdir()))
  process.env.WORKSHOP_STATE_STORE = storage.href

  const server = Object.assign(createServer(), {
    worker: new Worker(new URL(import.meta.url)),
  })

  // we do not wan to crash even if the worker we failed to reload worker
  process.on("uncaughtException", console.error)

  const address =
    networkInterfaces().en0?.find(address => address.family === "IPv4")
      ?.address || "localhost"

  server.on("request", async (incoming, outgoing) => {
    try {
      const body =
        incoming.method === "GET"
          ? null
          : incoming.method === "HEAD"
          ? null
          : /** @type {ReadableStream} */ (
              Readable.toWeb(/** @type {*} */ (incoming))
            )

      const { port1: receiver, port2: sender } = new MessageChannel()

      server.worker.postMessage(
        {
          fetch: {
            headers: incoming.headers,
            url: new URL(incoming.url ?? "/", url).href,
            method: incoming.method,
            body,
            port: sender,
          },
        },
        body ? [/** @type {*} */ (body), sender] : [sender]
      )

      const message = await receive(receiver)

      outgoing.writeHead(message.status, message.statusText, message.headers)

      /** @type {ReadableStreamDefaultReader<Uint8Array>} */
      const reader = message.body.getReader()
      while (true) {
        const chunk = await reader.read()
        if (chunk.value) {
          outgoing.write(chunk.value)
        }
        if (chunk.done) {
          break
        }
      }

      reader.releaseLock()

      outgoing.end(() => {
        outgoing.destroy()
      })
    } catch (error) {
      outgoing.statusCode = 500
      outgoing.write(`${error}`)
      outgoing.end(() => {
        outgoing.destroy()
      })
    }
  })
  await new Promise(resolve => server.listen(port, () => resolve(null)))

  const url = new URL(
    `http://${address}:${/** @type {{port:number}} */ (server.address()).port}`
  )
  console.log(`Listening ${url}`)

  const { watch } = await import("node:fs/promises")
  for await (const event of watch(new URL("./", import.meta.url), {
    recursive: true,
  })) {
    console.log("ℹ️  Reload server worker")
    try {
      const worker = new Worker(new URL(import.meta.url))
      server.worker.terminate()
      server.worker = worker
    } catch {}
  }
}

const work = async () => {
  const worker = await import("./worker.js")

  /**
   * @typedef {object} Fetch
   * @property {ReadableStream|null} body
   * @property {HeadersInit} headers
   * @property {string} method
   * @property {string} url
   * @property {MessagePort} port
   *
   * @typedef {{fetch:Fetch}} Message
   */

  parentPort?.on(
    "message",
    /**
     * @param {Message} message
     */
    async message => {
      const [[branch, data]] = Object.entries(message)
      switch (branch) {
        case "fetch": {
          const { url, port, ...init } = data
          try {
            const response = await worker.fetch(new Request(url, init))

            port.postMessage(
              {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: response.body,
              },
              response.body ? [response.body] : []
            )
          } catch (error) {
            const { message, name } = /** @type {Error} */ (error)
            const body = new Blob([message]).stream()
            port.postMessage(
              {
                status: 500,
                headers: {},
                statusText: name,
                body,
              },
              [body]
            )
          }
        }
      }
    }
  )
}

/**
 *
 * @param {MessagePort} port
 */
const receive = port =>
  new Promise((resolve, reject) => {
    port.onmessage = ({ data }) => {
      resolve(data)
      port.close()
    }
  })

const main = () => {
  if (isMainThread) {
    supervise()
  } else {
    work()
  }
}

main()
