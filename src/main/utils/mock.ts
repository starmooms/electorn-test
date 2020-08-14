export default function translateList() {
  const list: any[] = []
  for (let i = 0; i < 8; i++) {
    list.push({
      channelId: 0,
      workerCode: 0,
      I: Math.floor(Math.random() * 3000),
      U: Math.floor(Math.random() * 1400) + 3600,
      endStatus: 0,
      errorCode: 0
    })
  }
  return list
}
