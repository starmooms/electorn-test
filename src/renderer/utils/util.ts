import dayjs from 'dayjs'
import { WORKSTEPSINPUT, WORKSTEPS_TYPE_MAP } from '@/shared/config/port'
import { deepClone } from '@/shared/utils'
import path from 'path'

export const formatTimeStr = 'YYYY-MM-DD HH:mm:ss'

export interface ChartFullNullOpts {
  time: number
  len: number
}

// declare type StepFormatList = {
//   id: number
//   loopNum: number
//   type: string
//   code: string
//   input: {
//     [key: string]: number
//   }
//   msg: string
// }[]

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

/** 精度计算除法 */
export const computerDiv = (num1: number, num2: number, r = 10) => {
  return ((num1 * r) / (num2 * r)) * r
}

/**  */
export const getPercent = (num1: number, num2: number, r = 2) => {
  return computerDiv(num1, num2, 10 ** r).toFixed(r) + '%'
}

/** 格式化idList */
export const idListFormat = (idList: string) => {
  const idArr = idList.split(',').map(item => Number(item))
  const idShowArr = idArr.map(item => item + 1).join(',')
  return {
    idArr,
    idShowArr
  }
}

/** 格式化时间戳 */
export const dateFormat = (time: number) => {
  if (time) {
    return dayjs(time).format(formatTimeStr)
  }
  return ''
}

/** 工步循环列表 */
export const stepLoop = (
  list: UtilT.StepFormatList,
  loopList: UtilT.StepFormatList = [],
  start = 0,
  end = list.length,
  isDeep = false
) => {
  if (!isDeep) {
    list = deepClone(list)
  }
  for (let i = start; i < end; i++) {
    const item = list[i]
    if (isDeep) item.loopNum += 1
    item.loopId = `${item.id + 1}-${item.loopNum}`
    loopList.push(deepClone(item))
    if (item.type === 'loop') {
      const startId = item.input.loopStart - 1
      const loopNum = item.input.loopNum
      const loopStartStep = list[startId]
      if (loopStartStep) {
        let loopStep = 0
        // 循环次数
        while (loopStep < loopNum) {
          // 循环工步
          stepLoop(list, loopList, startId, i, true)
          ++loopStep
        }
      }
    }
  }
  return loopList
}

/** 格式化工步 */
export const stepsFormat = (
  stepList: Db.StepList[],
  checkLoop = false,
  filterLoop = true
) => {
  let list: UtilT.StepFormatList = []
  stepList.forEach((steps, index) => {
    const stepInfo = WORKSTEPS_TYPE_MAP[steps.type]
    if (!stepInfo) return
    let msgData = ''
    Object.entries(steps.input).forEach(([key, val]) => {
      const valData: any = WORKSTEPSINPUT[key]
      if (valData) {
        if (val === null) {
          msgData += `无${valData.name},`
        } else {
          msgData += `${valData.name}${val}${valData.unit}，`
        }
      }
    })
    if (msgData) {
      msgData = msgData.slice(0, -1)
    }
    const showId = index + 1
    list.push({
      id: index,
      showId,
      loopNum: 1,
      loopId: `${showId}-1`,
      code: stepInfo.key,
      type: stepInfo.type,
      input: steps.input,
      msg: `${stepInfo.name}：${msgData}`
    })
  })

  if (checkLoop) {
    list = stepLoop(list)
  }

  if (filterLoop) {
    return list.filter(item => item.type !== 'loop')
  }

  return list
}

/** 格式化启动信息 */
export const startInfoFormat = (
  startInfo: Db.StartInfo
): UtilT.StartInfoFormat => {
  const idList: any = {}
  ;['masterId', 'slaverId', 'channelId'].forEach(idKey => {
    const idResult = idListFormat(startInfo[`${idKey}s`])
    idList[`${idKey}Arr`] = idResult.idArr
    idList[`${idKey}ShowStr`] = idResult.idShowArr
  })

  return {
    ...startInfo,
    ...idList,
    stepList: stepsFormat(JSON.parse(startInfo.stepList), false, false),
    protect: JSON.parse(startInfo.protect),
    features: JSON.parse(startInfo.features),
    dataSave: JSON.parse(startInfo.dataSave)
  }
}

/** 解析路径 */
export const PathResolve = (...args: string[]) => {
  return path.resolve(...args)
}

/** 获取Vue父级组件 */
export const getVmParent = <T = any>(vm: Vue, name: string): T => {
  const parent = vm.$parent
  if (parent) {
    if (parent.$options.name === name) {
      return parent as any
    }
    return getVmParent(parent, name)
  }
  return null as any
}
