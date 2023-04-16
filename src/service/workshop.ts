import * as Server from "@ucanto/server"
import * as Capability from "../capabilities.js"
import * as FS from "node:fs/promises"
import { ok, error } from "@ucanto/core"
import { CBOR } from "@ucanto/core"
import { commit } from "./effect.js"
import * as API from "./api.js"

export const hello = Server.provide(
  Capability.WorkshopHello,
  async ({ capability }) => {
    const state = await commit(
      /**
       *
       * @param {API.Model} state
       * @returns {API.Model}
       */
      state => {
        const { name } = capability.nb
        if (state[name]) {
          return state
        } else {
          const position = Object.keys(state).length + 1
          const score =
            position == 1 ? 15 : position == 2 ? 10 : position == 3 ? 8 : 5
          return {
            ...state,
            [name]: {
              did: capability.with,
              score,
            },
          }
        }
      },
      {}
    )

    const participant = state[capability.nb.name]

    if (participant.did !== capability.with) {
      return {
        error: {
          message: `Challenge with name ${name} has already registered, please choose a different name.`,
        },
      }
    } else {
      return {
        ok: {
          challenger: participant,
          message: `Hello ${capability.nb.name}!`,
        },
      }
    }
  }
)
