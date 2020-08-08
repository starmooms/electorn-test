/** 工步 */
export const workSteps = {
  ICi: { name: '恒流充电', value: 'A1', input: ['U', 'I'] },
  UCi: { name: '恒压充电', value: 'A2', input: ['U', 'I'] },
  IUCi: { name: '恒流恒压充电', value: 'A3', input: ['U', 'I', 'IEnd'] },
  IDisCi: { name: '恒流放电', value: 'B0', input: ['U', 'I'] },
  shelve: { name: '搁置', value: '90', input: ['time'] },
  loop: { name: '循环', value: '70', input: ['loopStart', 'loopNum'] }
  // IPerCi: { name: '恒流预充', value: 'A0', input: null },
  // WCi: { name: '恒功率充电', value: 'A4', input: null }
}

/** 工步input字节序号 */
export const workStepsInput = {
  time: { len: 2, serial: 6, name: '时间(秒)' },
  U: { len: 2, serial: 7, name: '电压(mV)' },
  I: { len: 4, serial: 8, name: '电流(mA)' },
  W: { len: 4, serial: 9, name: '功率(W)' },
  R: { len: 4, serial: 10, name: '电阻(mΩ)' },
  loopNum: { len: 4, serial: 11, name: '循环次数' },
  loopStart: { len: 1, serial: 12, name: '循环起始' },
  IEnd: { len: 4, serial: 14, name: '截止电流' }
}

/** 通道数据 */
export const channelList = {}
for (let i = 1; i <= 20; i++) {
  const slaverObj = {}
  for (let j = 1; j <= 32; j++) {
    const obj = {}
    for (let k = 1; k <= 8; k++) {
      obj[k] = {
        id: k
      }
    }
    slaverObj[`slaver_${j}`] = {
      id: j,
      list: obj
    }
  }
  channelList[`master_${i}`] = {
    id: i,
    slaverList: slaverObj
  }
}

/** 控制码 */
export const controlCode = {
  writeWorkSteps: 0xe3, // 写从控工步参数
  readWorkSteps: 0xc3, // 读从控工步参数
  slaver: {
    start: 0xeb,
    pause: 0xec,
    continued: 0xed,
    close: 0xee
  }
}
