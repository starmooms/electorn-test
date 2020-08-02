/** 工步 */
export const workSteps = {
  IPerCi: {
    name: '恒流预充',
    value: 'A0'
  },
  ICi: {
    name: '恒流充电',
    value: 'A1',
    input: ['U', 'I']
  },
  UCi: {
    name: '恒压充电',
    value: 'A2',
    input: ['U', 'I']
  },
  IUPerCi: {
    name: '恒流恒压充电',
    value: 'A3'
  },
  WCi: {
    name: '恒功率充电',
    value: 'A4'
  }
}

/** 控制码 */
export const controlCode = {
  writeWorkSteps: 0xe3, // 写从控工步参数
  readWorkSteps: 0xc3 // 读从控工步参数
}
