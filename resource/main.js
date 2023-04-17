export const main = () => {
  const source = new EventSource("/event-stream")
  source.addEventListener("change", ({ data }) => {
    document.getElementById("board").innerHTML = renderBoard(JSON.parse(data))
    // source.close()
  })
}

const renderBoard = players =>
  players.map(renderPlayer).join("\n")

const renderPlayer = ({ did, score, player }) =>
  `<article class="dt w-100 bb b--black-05 ph3 pv2 mt2" style="${
    player.store?.style || ""
  }; order: -${score};">
  <div class="ba b--black-10 br3 dtc w2 w3-ns v-mid" style="background-color: ${
    player.paint ?? "transparent"
  };">
    <img src="https://robohash.org/${did}" class="db br-100 w2 w3-ns h2 h3-ns"/>
  </div>
  <div class="dtc v-mid pl3">
    <h1 class="f6 f5-ns fw6 lh-title black">${
      player.name === did ? "" : player.name
    }</h1>
    <h2 class="f6 fw4 mt0 mb0 black-60 code">${did}</h2>
  </div>
  <div class="dtc v-mid tr">
    <span class="f4 dib h2 w2 br-100 pa2 bg-near-white ba b--black-10 tc lh-copy">${score}</span>
  </div>
</article>`

main()
