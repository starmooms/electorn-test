/** 校准---误差标准选项 */
export const STANDARD_OPTS = [0.0005, 0.0002, 0.0001]

/** 校准---电压量程 */
export const U_RANGE_OPTS = [
  { id: 0, label: '0/1/2/3/4/5 v', value: [0, 1, 2, 3, 4, 5] }
]

/** 校准---电流量程 */
export const I_RANGE_OPTS = [
  { id: 0, label: '0/0.1/0.5/1/2/2.8a', value: [0, 0.1, 0.5, 1, 2, 2.8] }
]

/** 校准类型 */
export const CALIBRATE_TYPE = [
  { label: '充电电流', type: 'ICharge' },
  { label: '放电电流', type: 'IDisCharge' },
  { label: '充电电压', type: 'UCharge' }
]
