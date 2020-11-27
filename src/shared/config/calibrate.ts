/** 校准---误差标准选项 */
export const STANDARD_OPTS = [0.0005, 0.0002, 0.0001]

/** 校准---电压量程 */
export const U_RANGE_OPTS = [
  { id: 0, label: '0/0.5/1/2/3/4/5 V', value: [0, 0.5, 1, 2, 3, 4, 5] }
]

/** 校准---电流量程 */
export const I_RANGE_OPTS = [
  {
    id: 0,
    label: '0/0.05/0.1/0.5/1/2/3 A',
    value: [0, 0.05, 0.1, 0.5, 1, 2, 3]
  }
]

/** 工装校准--电压量程 */
export const U_TOOL_RANGE_OPTS = [
  {
    id: 0,
    label: '0/0.5/1/2/3/4/5 V',
    value: [0, 0.5, 1, 2, 3, 4, 5]
  }
]

/** 工装校准--电流量程 */
export const I_TOOL_RANGE_OPTS = [
  {
    id: 0,
    label: '0/0.05/0.1/0.5/1/2/3 A',
    value: [0, 0.05, 0.1, 0.5, 1, 2, 3]
  }
]

/** 校准类型 */
export const CALIBRATE_TYPE = [
  { label: '充电电流', type: '02', rangeType: 'A', meanwhile: true },
  { label: '放电电流', type: '03', rangeType: 'A', meanwhile: false },
  { label: '充电电压', type: '01', rangeType: 'V', meanwhile: true }
]

/** 校准工具 工装机柜号 */
export const CALTOOL_ID = 204 // 0xcc
