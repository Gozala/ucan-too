export const main = () => {
  const source = new EventSource("/event-stream")
  source.addEventListener("change", ({ data }) => {
    const state = JSON.parse(data)
    const participants = Object.entries(state)
      .map(([name, participant]) => {
        return { ...participant, name }
      })
      .sort((a, b) => b.score - a.score)

    document.getElementById("board").innerHTML = `${participants
      .map(member => `<li>${member.name} ${member.score}</li>`)
      .join("\n")}`
  })
}

main()
