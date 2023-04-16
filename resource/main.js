export const main = () => {
  const source = new EventSource("/event-stream")
  source.addEventListener("change", ({ data }) => {
    const participants = JSON.parse(data)
    
    document.getElementById("board").innerHTML = `${participants
      .map(member => `<li>${member.name} - ⭐️ ${member.score}</li>`)
      .join("\n")}`
  })
}

main()
