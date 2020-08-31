import dayjs from 'dayjs'

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
  let UData: [string, number][] = []
  let IData: [string, number][] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const len = Math.abs(item.createTime - lastTime)
    if (len >= 2) {
      const opts = {
        time: lastTime,
        len
      }
      let data: any
      if (fullFun) {
        data = await fullFun(opts)
      } else {
        data = chartFullNull(opts)
      }

      UData = [...UData, ...data.UData]
      IData = [...IData, ...data.IData]
    }
    const x = dayjs.unix(item.createTime).format('YYYY-MM-DD HH:mm:ss')
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
