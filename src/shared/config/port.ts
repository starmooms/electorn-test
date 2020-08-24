import { typedKeys } from '../utils'

/** 工步 */
export const workSteps = {
  ICi: { name: '恒流充电', value: 'A1', input: ['U', 'I'], limt: {} },
  UCi: { name: '恒压充电', value: 'A2', input: ['U', 'I'] },
  IUCi: { name: '恒流恒压充电', value: 'A3', input: ['U', 'I', 'IEnd'] },
  IDisCi: { name: '恒流放电', value: 'B0', input: ['U', 'I'] },
  shelve: { name: '搁置', value: '90', input: ['time'] },
  loop: { name: '循环', value: '70', input: ['loopStart', 'loopNum'] }
  // IPerCi: { name: '恒流预充', value: 'A0', input: null },
  // WCi: { name: '恒功率充电', value: 'A4', input: null }
}

/** 工步 */
export const WORKSTEPS = [
  {
    name: '恒流充电',
    type: 'ICi',
    key: 'a1',
    input: { worker: ['I'], limt: ['U'] }
  },
  {
    name: '恒压充电',
    type: 'UCi',
    key: 'a2',
    input: { worker: ['U'], limt: ['I'] }
  },
  {
    name: '恒流恒压充电',
    type: 'IUCi',
    key: 'a3',
    input: { worker: ['I', 'U'], limt: ['IEnd'] }
  },
  {
    name: '恒流放电',
    type: 'IDisCi',
    key: 'b0',
    input: { worker: ['I'], limt: ['U'] }
  },
  {
    name: '搁置',
    type: 'shelve',
    key: '90',
    input: {
      worker: ['time'],
      limt: []
    }
  },
  {
    name: '循环',
    type: 'loop',
    key: '70',
    input: { worker: ['loopStart'], limt: ['loopNum'], other: ['loopNow'] }
  }
]
export const WORKSTEPS_MAP: any = {}
export const WORKSTEPS_TYPE_MAP: any = {}

WORKSTEPS.forEach(item => {
  WORKSTEPS_MAP[item.key] = item
  WORKSTEPS_TYPE_MAP[item.type] = item
})

/** 工步input字节序号 */
export const workStepsInput = {
  time: { len: 4, serial: 4, unit: 's', name: '时间(秒)' },
  U: { len: 2, serial: 5, unit: 'mV', name: '电压(mV)' },
  I: { len: 4, serial: 6, unit: 'mA', name: '电流(mA)' },
  W: { len: 4, serial: 7, unit: 'W', name: '功率(W)' },
  R: { len: 4, serial: 8, unit: 'mΩ', name: '电阻(mΩ)' },
  loopNum: { len: 4, serial: 9, unit: '', name: '循环次数' },
  loopStart: { len: 1, serial: 10, unit: '', name: '循环起始' },
  loopNow: { len: 1, serial: 11, unit: '', name: '当前循环次数' },
  IEnd: { len: 4, serial: 12, unit: 'mA', name: '截止电流' }
}

export const WORKSTEPSINPUT = workStepsInput

// /** 读工步数据 */
// export const workStepsRead = {
//   U: { len: 2, serial: 6, name: '电压(mV)' },
//   I: { len: 4, serial: 7, name: '电流(mA)' },
//   temp: { len: 1, serial: 8, name: '温度(℃)' },
//   time: { len: 4, serial: 9, name: '工步时间(秒)' },
//   Ah: { len: 4, serial: 10, name: '容量(mAh)' },
//   Wh: { len: 4, serial: 11, name: '电量(mWh)' }
// }

export const END_STATUS = {
  '00': '未结束',
  '01': '时间到',
  '02': '电压到',
  '03': '终止电流到',
  '04': '-▲V到',
  '05': '电流异常',
  '06': '电压异常',
  '07': '容量异常',
  '08': '偏离平均电压异常',
  '09': '提前结束当前工步',
  '0a': '无电池或电池接触不良',
  '0b': '不良电池',
  '0c': '补充电容量到结束',
  ff: '未知结束'
}

/** 通道数据 */
export const channelList = {}
for (let i = 0; i < 20; i++) {
  const slaverObj = {}
  for (let j = 0; j < 32; j++) {
    const obj = {}
    for (let k = 0; k < 8; k++) {
      obj[k] = {
        id: k
      }
    }
    slaverObj[j] = {
      id: j,
      name: `从控${j + 1}`,
      list: obj
    }
  }
  channelList[i] = {
    id: i,
    name: `主控${i + 1}`,
    slaverList: slaverObj
  }
}

interface CalItem {
  name: string
  key: string
  index: number
  value: number | string
}

/** 校准列表 */
export function getCalList() {
  const list: CalItem[] = []
  let index = 1
  ;['电压校准参数', '电流校准参数', '电流反向校准参数'].forEach(item => {
    for (let i = 1; i <= 5; i++) {
      list.push(
        {
          name: item,
          key: `${i}-a`,
          index: index,
          value: 0
        },
        {
          name: item,
          key: `${i}-b`,
          index: index + 1,
          value: 0
        }
      )
      index += 2
    }
  })
  return list
}

// 保护参数
export const PROTECT_ITEM_MODE = [2, 2, 2, 2, 2, 2, 4]
export const PROTECT = [
  { name: '恒压充保护电压偏差(mV)', type: 'UCi', index: 0 },
  { name: '恒流充保护电流偏差(mA)', type: 'ICi', index: 1 },
  { name: '恒流放保护电流偏差(mA)', type: 'IDisCi', index: 2 },
  { name: '报警上限电压(mV)', type: 'UMax', index: 3 },
  { name: '报警下限电压(mV)', type: 'UMin', index: 4 },
  { name: '报警下限起效时间(min)', type: 'TimeMin', index: 5 },
  { name: '报警容量(mAh)', type: 'warnVal', index: 6 }
]
export const GET_PROTECT_FORM = () => {
  const form: any = {}
  PROTECT.map(item => {
    form[item.type] = null
  })
  return form
}

/** 控制码 */
export const controlCode = {
  writeWorkSteps: 0xe3, // 写从控工步参数
  readWorkSteps: 0xc3, // 读从控工步参数
  slaver: {
    start: 0xeb,
    pause: 0xec,
    continued: 0xed,
    close: 0xee,
    stepsRead: 0xc3,
    calRead: 0xc8,
    calSet: 0xe8,
    translateRead: 0xc5
  },
  master: {
    stepsSet: 0xa9,
    stepsRead: 0x89,
    translateRead: 0x85,
    status: {
      start: 0xa5,
      pause: 0xa6,
      continued: 0xa7,
      close: 0xa8
    }
  }
}
