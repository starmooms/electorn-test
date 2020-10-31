/** 校准相关 */
declare namespace CalibrateT {
  /** 校准设置表单 */
  interface CalConfForm {
    toolIp: string
    masterId: null
    slaverId: null
    channelId: number[]
    standard: null
    uRangeId: number
    iRangeId: null
  }
}
