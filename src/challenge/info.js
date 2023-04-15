import * as Capability from "../capabilities.js"
import * as Client from "@ucanto/client"
import { DID } from "@ucanto/core"
import * as CAR from "@ucanto/transport/car"
import * as HTTP from "@ucanto/transport/http"
import { ed25519 } from "@ucanto/principal"

/**
 * @param  {string} url
 */
export const main = async (url = `http://localhost:9000/`) => {
  const principal = await ed25519.generate()
  const response = await fetch(new URL("/.well-known/did.json", url))
  const data = await response.json()
  const { id, serviceEndpoint } = data.service[0]
  const client = Client.connect({
    codec: CAR.outbound,
    id: DID.parse(id),
    channel: HTTP.open({ url: new URL(serviceEndpoint) }),
  })

  const hello = Client.invoke({
    issuer: principal,
    audience: client.id,
    capability: {
      with: principal.did(),
      can: "provider/info",
    },
  })

  const [result] = await client.execute(hello)
  console.log(JSON.stringify(result.out, null, 2))
}

main(...process.argv.slice(2))
