export const CONTROL_CODE = {
  protectRead: 0x91,
  protectSet: 0xb1
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

