import dayjs from 'dayjs'
import { add } from 'lodash'

export const formatTimeStr = 'YYYY-MM-DD HH:mm:ss'

export interface ChartFullNullOpts {
  time: number
  len: number
}
export function chartFullNull({ time, len }: ChartFullNullOpts) {
  const UData: string[][] = []
  const IData: string[][] = []
  // ;[time + 1, time + len].forEach(item => {
  //   const full = dayjs.unix(item).format('YYYY-MM-DD HH:mm:ss')
  //   UData.push([full, '-'])
  //   IData.push([full, '-'])
  // })
  for (let i = 1; i < len; i++) {
    const full = dayjs.unix(time + i).format('YYYY-MM-DD HH:mm:ss')
    UData.push([full, '-'])
    IData.push([full, '-'])
  }
  return { UData, IData }
}

export const getSampChartList = async (
  list: any[],
  fullFun?: any,
  lastTime = 0
) => {
  if (!lastTime && list.length > 0) {
    lastTime = lastTime || list[0].createTime
  }
  const UData: [string, number][] = []
  const IData: [string, number][] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    // if (fullNull) {
    //   const len = Math.abs(item.createTime - lastTime)
    //   if (len >= 2) {
    //     const opts = {
    //       time: lastTime,
    //       len
    //     }
    //     let data: any
    //     if (fullFun) {
    //       data = await fullFun(opts)
    //     } else {
    //       data = chartFullNull(opts)
    //     }
    //     UData = [...UData, ...data.UData]
    //     IData = [...IData, ...data.IData]
    //   }
    // }

    const x = item.createTimeStr
      ? item.createTimeStr
      : dayjs.unix(item.createTime).format(formatTimeStr)
    UData.push([x, item.U])
    IData.push([x, item.I])
    lastTime = item.createTime
  }
  return {
    UData,
    IData,
    lastTime,
    lastX: UData.length > 0 ? UData[UData.length - 1][0] : ''
  }
}

export const setSampChartList = (list: Port.SampItem[]) => {
  list.map(item => {
    const time =
      item.createTimeStr || dayjs.unix(item.createTime).format(formatTimeStr)
    return [time, item.U, item.I]
  })
}

export const stepListSetInput = (item: any) => {
  return {
    label: `${item.name}：${item.data}${item.unit}`
  }
}

/** 工步列表处理 */
export const stepListUtil = (item: any) => {
  const worker = item.worker.map(stepListSetInput)
  const limt = item.limt.map(stepListSetInput)
  return {
    id: item.id,
    msg: `${item.id + 1}.${item.name}`,
    worker,
    limt
  }
}

// /** try catch修饰器 */
// export function CatchError() {
//   return function(target: Function) {}
//   // try {

//   // } catch (err) {
//   //   console.error(err)
//   // } finally {

//   // }
// }

export function getDefatulSamp() {
  return {
    U: 0,
    I: 0,
    workerId: null,
    errorMsg: '',
    workerCode: '00',
    workerStatus: {
      name: '',
      status: ''
    }
  }
}

export function stepListSimple(stepData?: Port.StepsDataItem) {
  let loopNow: number | null = null
  let stepList: {
    id: number
    msg: string
  }[] = []

  if (stepData) {
    stepList = stepData.stepList.map(item => {
      let msg = `${item.id + 1}、${item.name}`
      if (item.type === 'loop') {
        const hasLoopNow = item.worker.find(work => work.type === 'loopNow')
        if (hasLoopNow !== void 0) {
          loopNow = hasLoopNow.data
        }
      } else {
        const workers = item.worker
          .map(work => {
            return `${work.data}${work.unit}`
          })
          .join('、')
        msg += `（${workers}）`
      }
      return {
        id: item.id,
        msg
      }
    })
  }

  return {
    loopNow,
    stepList
  }
}

export const SAMPCHART_Y_MAP = {
  U: {
    name: '电压',
    unit: 'mV',
    color: 'green',
    key: 'U'
  },
  I: {
    name: '电流',
    unit: 'mA',
    color: 'red',
    key: 'I'
  },
  vol: {
    name: '容量',
    unit: 'mAh',
    color: 'cornflowerblue',
    key: 'vol'
  },
  epower: {
    name: '电量',
    unit: 'mWh',
    color: '#f7b521',
    key: 'epower'
  }
}

/** 精度计算加法 */
export const computerAdd = (num1: number, num2: number, r = 10) => {
  return (num1 * r + num2 * r) / r
}
