/** 校准相关 */
declare namespace CalibrateT {
  /** 校准设置表单 */
  interface CalConfForm {
    toolIp: string
    masterId: null | number
    slaverId: null | number
    channelId: number[]
    standard: number
    uRangeId: number
    iRangeId: number
  }

  /** 校准设置表单 */
  interface CalConfSubmitForm extends CalConfForm {
    masterId: number
    slaverId: number
  }
}

/** 校准页面相关 */
declare namespace CalibrateTR {
  interface StartData {
    calType: string[]
  }
}
