import { BufModelT } from '@/types/BufModel'
declare type Model = BufModelT.OrginModel

/**
 * 通用读发送数据model
 * 读实时数据/采样
 * 读校准时发送
 * 读工步发送
 *  */
export const COMMON_READ: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverBit', bytLen: 4 },
  { name: 'channelBit', bytLen: 1 }
]

/** 工步 */
export const WORKER_STEP_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 4 },
  { name: 'channelId', bytLen: 1 },
  { name: 'protectLen', bytLen: 1 },
  { name: 'workerLen', bytLen: 1 },
  {
    name: 'protectList',
    type: 'list',
    len: 'protectLen',
    model: [
      { name: 'channelId', bytLen: 1 },
      { name: 'UCi', bytLen: 2 }, // 恒压充保护电压偏差(mV)
      { name: 'ICi', bytLen: 2 }, // 恒流充保护电流偏差(mA)
      { name: 'IDisCi', bytLen: 2 }, // 恒流放保护电流偏差(mA)
      { name: 'UMax', bytLen: 2 }, // 报警上限电压(mV)
      { name: 'UMin', bytLen: 2 }, // 报警下限电压(mV)
      { name: 'TimeMin', bytLen: 2 }, // 报警下限起效时间(min)
      { name: 'warnVal', bytLen: 4 } // 报警容量(mAh)
    ]
  },
  {
    name: 'workerList',
    type: 'list',
    len: 'workerLen',
    model: [
      { name: 'version', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      { name: 'workerId', bytLen: 1 },
      { name: 'startModel', bytLen: 1 },
      { name: 'workerCode', bytLen: 1 },
      { name: 'time', bytLen: 4 },
      { name: 'U', bytLen: 2 },
      { name: 'I', bytLen: 4, type: 'int' },
      { name: 'W', bytLen: 4 },
      { name: 'R', bytLen: 4 },
      { name: 'loopNum', bytLen: 4 },
      { name: 'loopStart', bytLen: 1 },
      { name: 'loopNow', bytLen: 4 },
      { name: 'IEnd', bytLen: 4 }
    ]
  }
]

/** 状况控制 */
export const WORKER_SATUS_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaver', bytLen: 4 },
  { name: 'channel', bytLen: 1 }
]

/** 启动从控通道 */
export const WORKER_START_MODEL: Model[] = [
  ...WORKER_SATUS_MODEL,
  { name: 'startWorkerId', bytLen: 1 }
]

const GET_CAL_DATA = () => {
  const CAL_DATA = [
    { name: '电压校准参数', key: 'U' },
    { name: '电流校准参数', key: 'I' },
    { name: '电流反向校准参数', key: 'RevI' }
  ]
  const list: Model[] = []
  CAL_DATA.forEach(item => {
    for (let i = 1; i <= 5; i++) {
      list.push(
        {
          name: `${item.key}${i}-a`,
          bytLen: 4,
          type: 'float'
        },
        {
          name: `${item.key}${i}-b`,
          bytLen: 4,
          type: 'float'
        }
      )
    }
  })
  return list
}

/** 校准 */
export const CAL_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'calLen', bytLen: 1 },
  {
    name: 'calList',
    type: 'list',
    len: 'calLen',
    model: [
      { name: 'masterId', bytLen: 1 },
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      ...GET_CAL_DATA()
    ]
  }
]

/** 采样 */
export const SAMP_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'sampLen', bytLen: 1 },
  {
    name: 'sampList',
    type: 'list',
    len: 'sampLen',
    model: [
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      { name: 'workerCode', bytLen: 1 },
      { name: 'workerId', bytLen: 1 },
      { name: 'U', bytLen: 2 },
      { name: 'I', bytLen: 4, type: 'int' },
      { name: 'endCode', bytLen: 1 },
      { name: 'errCode', bytLen: 1 }
    ]
  }
]
