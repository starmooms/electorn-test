/** 工步 */
export const workSteps = {
  IPerCi: { name: '恒流预充', value: 'A0', input: null },
  ICi: { name: '恒流充电', value: 'A1', input: ['U', 'I'] },
  UCi: { name: '恒压充电', value: 'A2', input: ['U', 'I'] },
  IUCi: { name: '恒流恒压充电', value: 'A3', input: null },
  WCi: { name: '恒功率充电', value: 'A4', input: null }
}

/** 工步input字节序号 */
export const workStepsInput = {
  time: { len: 2, serial: 6, name: '时间(秒)' },
  U: { len: 2, serial: 7, name: '电压(mV)' },
  I: { len: 4, serial: 8, name: '电流(mA)' },
  W: { len: 4, serial: 9, name: '功率(W)' },
  R: { len: 4, serial: 10, name: '电阻(mΩ)' }
}

/** 控制码 */
export const controlCode = {
  writeWorkSteps: 0xe3, // 写从控工步参数
  readWorkSteps: 0xc3 // 读从控工步参数
}
