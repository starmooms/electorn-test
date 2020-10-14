import logger from '../core/Logger'

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

let testIndex = 0
export function testFilePath(samp: Port.SampItem) {
  let testPath = ''
  const len = 5
  if (samp.slaverId === 0 && samp.channelId === 0) {
    if (testIndex % len === 0) {
      const changeFilePath = [
        'E:\\up\\20201013233507188(1)',
        'E:\\up\\20201013233556116(1)',
        'E:\\up\\20201013233621261(1)'
      ]
      const index = (testIndex / len) % changeFilePath.length
      logger.info('Mainindex', index, testIndex, changeFilePath.length)
      testPath = changeFilePath[index]
    }
    testIndex++
  }
  return testPath
}
