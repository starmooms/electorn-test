/** 工步 */
export const WORKSTEPS = [
  {
    name: '恒流充电',
    type: 'ICi',
    key: 'a1',
    input: { worker: ['IStart'], limt: ['UEnd', 'limtTime'] },
    rules: {
      unReqire: ['limtTime']
    }
  },
  {
    name: '恒压充电',
    type: 'UCi',
    key: 'a2',
    input: { worker: ['UStart'], limt: ['IEnd', 'limtTime'] },
    rules: {
      unReqire: ['limtTime']
    }
  },
  {
    name: '恒流恒压充电',
    type: 'IUCi',
    key: 'a3',
    input: { worker: ['IStart', 'UEnd'], limt: ['stopI', 'limtTime'] },
    rules: {
      unReqire: ['limtTime']
    }
  },
  {
    name: '恒流放电',
    type: 'IDisCi',
    key: 'b0',
    input: { worker: ['IStart'], limt: ['UEnd', 'limtTime'] },
    rules: {
      unReqire: ['limtTime']
    }
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

export const WORKSTEPSINPUT = {
  time: { unit: 'min', name: '时间' },
  limtTime: { unit: 'min', name: '时间限制', type: 'time' },
  // U: { unit: 'mV', name: '电压' },
  // I: { unit: 'mA', name: '电流' },
  W: { unit: 'W', name: '功率' },
  R: { unit: 'mΩ', name: '电阻' },
  loopNum: { unit: '', name: '循环次数' },
  loopStart: { unit: '', name: '循环起始' },
  loopNow: { unit: '', name: '当前循环次数' },
  stopI: { unit: 'mA', name: '截止电流' },
  IStart: { unit: 'mA', name: '起始电流', type: 'I' },
  IEnd: { unit: 'mA', name: '截止电流', type: 'I' },
  UStart: { unit: 'mV', name: '起始电压', type: 'U' },
  UEnd: { unit: 'mV', name: '截止电压', type: 'U' }
}

/* eslint-disable quote-props */

// prettier-ignore
export const ERROR_STATUS = {
  '00': '正确',
  '01': '通讯失败',
  '02': '下位机无返回',
  '03': '帧格式错误',
  '04': '数据格式错误',
  '05': '版本错误',
  '06': '地址错误',
  '07': '控制码错误',
  '08': '数据长度不够',
  '09': '校验码错误',
  '0a': '无效数据',
  '0b': '数值超出范围',
  '0c': '串口已关闭',
  '0d': '没有工步信息',
  '0e': '工步未运行',
  '0f': '工步已运行',
  '10': '数据存储空间不够',
  '11': '没有数据可以发送',
  '12': '从控号错误',
  '13': '内存不够',
  '14': '流水号错误',
  '15': '主控号错误',
  '16': '从控号错误',
  '17': '通道号错误',
  '18': '固定字节错误(前后缀)',
  '19': '工步码错误' ,
  '20': '工步码不存在',
  '21': '工步列表为空',
  '22': '通道处于保护状态中',
  '23': '机身码错误',
  '24': 'Flash发生错误',
  '25': '空指针',
  'ff': '未知错误'
}

// prettier-ignore
export const END_STATUS = {
  '00': '未结束',
  '01': '时间到',
  '02': '到达指定电压',
  '03': '到达指定电流',
  '04': '-▲V到',
  '05': '电流异常',
  '06': '电压异常',
  '07': '容量异常',
  '08': '偏离平均电压异常',
  '09': '提前结束当前工步',
  '0a': '无电池或电池接触不良',
  '0b': '不良电池',
  '0c': '补充电容量到结束',
  '0d': '电压低于最低电压',
  '0e': '电压超过最大电压',
  '0f': '恒流转恒压',
  'ff': '未知结束'
}

// prettier-ignore
export const CHANNEL_ERR_STATUS = {
  '00': '无',
  '01': '寄存',
  '02': '漏电流异常',
  '03': '电压上限异常',
  '04': '电流异常',
  '05': '实时电压超过目标电压',
  '06': '容量异常',
  '07': '无电压无电流',
  '08': '温度异常',
  '09': '电压下限异常',
  '0a': '离线',
  'ff': '未知报警'
}

// prettier-ignore
export const CHANNEL_STATUS = {
  '00': { name: '空置', status: 'vacant' },
  '01': { name: '保护', status: 'protect' },
  '02': { name: '停止', status: 'stop' },
  '03': { name: '完成', status: 'end' },
  '04': { name: '暂停', status: 'pause' },
  '90': { name: '搁置', status: 'run' },
  'a0': { name: '恒流预充', status: 'run' },
  'a1': { name: '恒流充电', status: 'run' },
  'a2': { name: '恒压充电', status: 'run' },
  'a3': { name: '恒流恒压充电', status: 'run' },
  'a4': { name: '恒功率充电', status: 'run' },
  'b0': { name: '恒流放电', status: 'run' },
  'b1': { name: '恒阻放电', status: 'run' },
  'b2': { name: '恒功率放电', status: 'run' },
  '70': { name: '循环', status: 'run' },
}

export const CHANNEL_STATUS_END = ['00', '01', '02', '03']

/* eslint-enable quote-props */

/** 通道数据 */
export const channelList: Port.MasterList = {}
for (let i = 0; i < 20; i++) {
  const slaverObj = {}
  for (let j = 0; j < 32; j++) {
    const obj = {}
    for (let k = 0; k < 8; k++) {
      obj[k] = {
        id: k,
        fullId: `${i}_${j}_${k}`,
        samp: null,
        workerStart: null,
        workerEnd: null,
        filePath: null,
        lastSamp: null,
        lastSaveTime: null,
        nowStatus: 'END'
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
    name: `机柜${i + 1}`,
    slaverList: slaverObj
  }
}

/** 校准列表 */
export function getCalList() {
  const list: Port.CalItem[] = []
  let index = 3
  ;[
    { name: '电压校准参数', key: 'U' },
    { name: '电流校准参数', key: 'I' },
    { name: '电流反向校准参数', key: 'RevI' }
  ].forEach(item => {
    for (let i = 1; i <= 5; i++) {
      list.push(
        {
          name: item.name,
          key: `${i}-a`,
          index: index,
          nameKey: `${item.key}${i}-a`,
          value: 0
        },
        {
          name: item.name,
          key: `${i}-b`,
          nameKey: `${item.key}${i}-b`,
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
export const PROTECT = [
  { name: '恒压充保护电压偏差(mV)', type: 'UCi' },
  { name: '恒流充保护电流偏差(mA)', type: 'ICi' },
  { name: '恒流放保护电流偏差(mA)', type: 'IDisCi' },
  { name: '报警上限电压(mV)', type: 'UMax' },
  { name: '报警下限电压(mV)', type: 'UMin' },
  { name: '报警下限起效时间(min)', type: 'TimeMin' },
  { name: '报警容量(mAh)', type: 'warnVal' }
]
export const GET_PROTECT_FORM = () => {
  const form: any = {}
  PROTECT.map(item => {
    form[item.type] = null
  })
  return form
}

/** 控制码 */
export const CONTROL_CODE = {
  stepsSet: {
    code: 0xa9,
    name: '设置工步'
  },
  stepsRead: {
    code: 0x89,
    name: '读工步'
  },
  sampRead: {
    code: 0x85,
    name: '读实时数据'
  },
  status: {
    start: {
      code: 0xa5,
      name: '通道开启'
    },
    pause: {
      code: 0xa6,
      name: '通道暂停'
    },
    continued: {
      code: 0xa7,
      name: '通道继续'
    },
    close: {
      code: 0xa8,
      name: '通道关闭'
    },
    reset: {
      code: 0xa4,
      name: '通道复位'
    }
  },
  // calSet: {
  //   code: 0xaa,
  //   name: '设置校准'
  // },
  // calRead: {
  //   code: 0x8a,
  //   name: '读校准'
  // },
  lampSet: {
    code: 0xa3,
    name: '通道灯设置'
  },
  masterInfoRead: {
    code: 0x86,
    name: '读主控信息'
  },
  masterInfoSet: {
    code: 0xb3,
    name: '写主控信息'
  },
  calibrateSet: {
    code: 0xaa,
    name: '写校准'
  },
  calibrateRead: {
    code: 0x8a,
    name: '读校准'
  },
  upgradeSend: {
    code: 0xb5,
    name: '发送升级文件'
  },
  restartMaster: {
    code: 0xb4,
    name: '重启机柜'
  }
}
