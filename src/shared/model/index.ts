import { BufModelT } from '@/types/BufModel'
import { Model } from 'vue-property-decorator'
declare type Model = BufModelT.OrginModel

/** 版本号 */
export const VERSERION = 0

/**
 * 通用读发送数据model
 * 读实时数据/采样
 * 读校准时发送
 * 读工步发送
 *  */
export const COMMON_READ = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverBit', bytLen: 4 },
  { name: 'channelBit', bytLen: 1 }
]

// declare type ElementType<
//   T extends ReadonlyArray<Model>
// > = T extends ReadonlyArray<infer ElementType> ? ElementType : never
// declare type c = ElementType<typeof COMMON_READ>
// declare type d = c['name']

/** 工步 */
export const WORKER_STEP_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 4 },
  { name: 'channelId', bytLen: 1 },
  { name: 'projectId', bytLen: 4 },
  { name: 'workStart', bytLen: 1 },
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
      { name: 'warnVal', bytLen: 4 }, // 报警容量(mAh)
      // 特征电压参数
      { name: 'feature_v1', bytLen: 2 },
      { name: 'feature_v2', bytLen: 2 },
      { name: 'feature_v3', bytLen: 2 },
      { name: 'feature_v4', bytLen: 2 },
      { name: 'feature_v5', bytLen: 2 }
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
      { name: 'loopNum', bytLen: 2 },
      { name: 'loopStart', bytLen: 1 },
      { name: 'loopNow', bytLen: 2 },
      { name: 'stopI', bytLen: 4 }
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

/** 采样通用参数 */
const SAMP_COM_PAR = {
  workerCode: { name: 'workerCode', bytLen: 1 },
  stepId: { name: 'stepId', bytLen: 1 },
  U: { name: 'U', bytLen: 4 },
  I: { name: 'I', bytLen: 4, type: 'int' },
  vol: { name: 'vol', bytLen: 4 },
  epower: { name: 'epower', bytLen: 4 },
  projectId: { name: 'projectId', bytLen: 4 },
  loopNum: { name: 'loopNum', bytLen: 2 },
  stepTime: { name: 'stepTime', bytLen: 4 }
}

/** 采样工步数据 */
const SAMP_COM_PAR_STEP: BufModelT.OrginModel[] = [
  SAMP_COM_PAR.workerCode,
  SAMP_COM_PAR.stepId,
  SAMP_COM_PAR.U,
  SAMP_COM_PAR.I,
  SAMP_COM_PAR.vol,
  SAMP_COM_PAR.epower
]

/** 采样状态数据 */
const SAMP_COM_PAR_STATUS: BufModelT.OrginModel[] = [
  SAMP_COM_PAR.projectId,
  SAMP_COM_PAR.loopNum,
  SAMP_COM_PAR.stepTime
]

/** 采样 */
export const SAMP_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'sampLen', bytLen: 2 },
  { name: 'errorLen', bytLen: 1 },
  { name: 'startLen', bytLen: 1 },
  { name: 'endLen', bytLen: 1 },
  { name: 'featureLen', bytLen: 1 },
  {
    name: 'sampList',
    type: 'list',
    len: 'sampLen',
    model: [
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      ...SAMP_COM_PAR_STEP,
      { name: 'errCode', bytLen: 1 },
      ...SAMP_COM_PAR_STATUS
    ]
  },
  {
    name: 'errorList',
    type: 'list',
    len: 'errorLen',
    model: [
      { name: 'masterId', bytLen: 1 },
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      { name: 'controlCode', bytLen: 1 },
      { name: 'errCode', bytLen: 1 },
      { name: 'params1', bytLen: 4 },
      { name: 'params2', bytLen: 4 }
    ]
  },
  {
    name: 'startList',
    type: 'list',
    len: 'startLen',
    model: [
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      { name: 'projectId', bytLen: 4 },
      SAMP_COM_PAR.stepId,
      SAMP_COM_PAR.workerCode,
      SAMP_COM_PAR.U,
      SAMP_COM_PAR.I,
      SAMP_COM_PAR.loopNum
    ]
  },
  {
    name: 'endList',
    type: 'list',
    len: 'endLen',
    model: [
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      ...SAMP_COM_PAR_STEP,
      { name: 'endCode', bytLen: 1 },
      ...SAMP_COM_PAR_STATUS
    ]
  },
  {
    name: 'featureList',
    type: 'list',
    len: 'featureLen',
    model: [
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelId', bytLen: 1 },
      ...SAMP_COM_PAR_STEP,
      ...SAMP_COM_PAR_STATUS,
      { name: 'featureType', bytLen: 1 }
    ]
  }
]

/** 点灯控制 */
export const LAMP_MODEL: Model[] = [
  { name: 'masterId', bytLen: 1 },
  { name: 'lampLen', bytLen: 1 },
  {
    name: 'lampList',
    type: 'list',
    len: 'lampLen',
    model: [
      { name: 'slaverId', bytLen: 1 },
      { name: 'channelBit', bytLen: 1 }
    ]
  }
]

/** IP读主控信息发送 */
export const MASERT_INFO_READ: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 }
]

/** IP读主控信息返回 */
export const MASERT_INFO: Model[] = [
  { name: 'version', bytLen: 10 },
  { name: 'masterId', bytLen: 1 },
  { name: 'machineId', bytLen: 8 },
  { name: 'ip', bytLen: 4 },
  { name: 'mask', bytLen: 4 },
  { name: 'gateway', bytLen: 4 },
  { name: 'slaverLen', bytLen: 1 },
  {
    name: 'slaverList',
    type: 'list',
    len: 'slaverLen',
    model: [
      { name: 'version', bytLen: 10 },
      { name: 'slaverId', bytLen: 1 },
      { name: 'machineId', bytLen: 8 }
    ]
  }
]

/** IP写主控信息返回 */
export const MASERT_INFO_SET: Model[] = [
  { name: 'machineId', bytLen: 8 },
  { name: 'masterId', bytLen: 1 },
  { name: 'ip', bytLen: 4 },
  { name: 'mask', bytLen: 4 },
  { name: 'gateway', bytLen: 4 }
]

/** 写校准 */
export const CAL_SET_MODEL: Model[] = [
  { name: 'type', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 1 },
  { name: 'channelBit', bytLen: 1 },
  { name: 'calType', bytLen: 1 },
  { name: 'pointer', bytLen: 4 },
  { name: 'pointIndex', bytLen: 1 },
  { name: 'abLen', bytLen: 1 },
  {
    name: 'abList',
    type: 'list',
    len: 'abLen',
    model: [
      { name: 'channelId', bytLen: 1 },
      { name: 'calType', bytLen: 1 },
      { name: 'range', bytLen: 1 },
      { name: 'a', bytLen: 4, type: 'float' },
      { name: 'b', bytLen: 4, type: 'float' }
    ]
  }
]

/** 读校准发送 */
export const CAL_READ_POST_MODEL: Model[] = [
  { name: 'version', bytLen: 1 },
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 1 },
  { name: 'channelBit', bytLen: 1 },
  { name: 'readType', bytLen: 1 },
  { name: 'calType', bytLen: 1 },
  { name: 'pointer', bytLen: 4 }
]

/** 读校准返回 */
export const CAL_READ_MODEL: Model[] = [
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 1 },
  { name: 'readType', bytLen: 1 },
  { name: 'calType', bytLen: 1 },
  { name: 'sampLen', bytLen: 1 },
  { name: 'abLen', bytLen: 1 },
  {
    name: 'sampList',
    type: 'list',
    len: 'sampLen',
    model: [
      { name: 'channelId', bytLen: 1 },
      { name: 'samp', bytLen: 4, type: 'int' }
    ]
  },
  {
    name: 'abList',
    type: 'list',
    len: 'abLen',
    model: [
      { name: 'channelId', bytLen: 1 },
      { name: 'calType', bytLen: 1 },
      { name: 'range', bytLen: 1 },
      { name: 'a', bytLen: 4, type: 'float' },
      { name: 'b', bytLen: 4, type: 'float' }
    ]
  }
]

/** 机柜升级发送 */
export const UPGRADE_MODEL: Model[] = [
  { name: 'upgradeType', bytLen: 1 }, // 1：主控 2：丛控
  { name: 'masterId', bytLen: 1 },
  { name: 'total', bytLen: 4 },
  { name: 'offset', bytLen: 4 },
  { name: 'size', bytLen: 4 },
  { name: 'check', bytLen: 4 },
  { name: 'totalCheck', bytLen: 4 },
  { name: 'data', bytLen: 0 }
]

/** 机柜升级返回 */
export const UPGRADE_BACK_MODEL: Model[] = [
  { name: 'upgradeType', bytLen: 1 }, // 1：主控 2：丛控
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 1 },
  { name: 'offset', bytLen: 4 },
  { name: 'errCode', bytLen: 1 }
]

/** 重启机柜 */
export const RESTART_MASTER: Model[] = [
  { name: 'masterId', bytLen: 1 },
  { name: 'slaverId', bytLen: 4 } //
]
