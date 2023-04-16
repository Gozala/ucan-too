export const main = () => {
  const source = new EventSource("/event-stream")
  source.addEventListener("change", ({ data }) => {
    const participants = JSON.parse(data)

    document.getElementById("board").innerHTML = `${participants
      .map(({ did, name, score, md5 }) => {
        return `<article class="dt w-100 bb b--black-05 pb2 mt2">
  <div class="dtc w2 w3-ns v-mid">
    <img src="https://www.gravatar.com/avatar/${md5}?d=retro" class="ba b--black-10 db br2 w2 w3-ns h2 h3-ns"/>
  </div>
  <div class="dtc v-mid pl3">
    <h1 class="f6 f5-ns fw6 lh-title black mv0">${name === did ? "No Name" : name}</h1>
    <h2 class="f6 fw4 mt0 mb0 black-60">${did}</h2>
  </div>
  <div class="dtc v-mid tr">
    <span class="f4 dib h2 w2 br-100 pa2 bg-near-white ba b--black-10 tc lh-copy">${score}</span>
  </div>
</article>`
      })
      .join("\n")}`    
  })
}

main()
