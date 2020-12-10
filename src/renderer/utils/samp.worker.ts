import { chartFullNull, getSampChartList } from './util'

const webWorker: Worker | any = self

const postChatList = async (data: any) => {
  const result = await getSampChartList(data)
  return webWorker.postMessage(result)
}

webWorker.addEventListener('message', event => {
  const { action, data } = event.data
  switch (action) {
    case 'getSampChartList':
      postChatList(data)
      break
    case 'chartFullNull':
      webWorker.postMessage(chartFullNull(data))
      break
    default:
      webWorker.close()
      break
  }
})
