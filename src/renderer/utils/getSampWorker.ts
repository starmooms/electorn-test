import { chartFullNull, getSampChartList } from './util'

class GetSampWorker {
  async fullNullData(data: any) {
    if (data.len <= 2000) {
      return chartFullNull(data)
    } else {
      return this.createWorker('chartFullNull', data)
    }
  }

  async getSampList(
    data,
    lastTime = 0,
    fullNull = false
  ): Promise<ReturnType<typeof getSampChartList>> {
    if (data.length <= 2000) {
      return getSampChartList(
        data,
        data => {
          return this.fullNullData(data)
        },
        lastTime,
        fullNull
      )
    } else {
      return this.createWorker('getSampChartList', data)
    }
  }

  createWorker(action: string, data: any): Promise<any> {
    const worker = new Worker('./samp.worker.ts', { type: 'module' })
    return new Promise((resolve, rejects) => {
      worker.postMessage({
        action,
        data
      })
      worker.addEventListener('message', data => {
        resolve(data.data as any)
      })
      worker.addEventListener('error', err => {
        rejects(err)
      })
    }).finally(() => {
      worker.terminate()
    })
  }
}

const getSampWorker = new GetSampWorker()
export default getSampWorker
