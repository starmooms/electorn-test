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

  /** 修调点结果 */
  interface CalRunResultPoint {
    samp: number
    actual: number
  }

  /** 校准运行结果缓存对象 */
  interface CalRunResultCache {
    [channelId: string]: {
      [pointIndex: string]: {
        samp: number
        actual: number
      }
    }
  }

  /** 校准运行结果列表 */
  interface CalRunResultItem {
    masterId: number
    slaverId: number
    channelId: number
    pointIndex: number
    calType: string
    calTypeName: string
    point1Name: string
    point1Result: CalRunResultPoint
    point2Name: string
    point2Result: CalRunResultPoint
    a: number
    b: number
    time: string
  }
}

/** 校准页面相关 */
declare namespace CalibrateTR {
  interface StartData {
    calType: string[]
  }

  interface RecheckForm {
    IStep: null | number
    IStart: null | number
    IEnd: null | number
    UStep: null | number
    UStart: null | number
    UEnd: null | number
  }

  interface RecheckSumbitForm {
    IStep: number
    IStart: number
    IEnd: number
    UStep: number
    UStart: number
    UEnd: number
  }
}

/** 校准页面 后台进程相关 */
declare namespace CalibrateTB {
  /** 读校准返回 */
  interface CalResult {
    [channelId: number]: {
      samp: null | number
      a: null | number
      b: null | number
    }
  }

  interface AbListItem {
    channelId: number
    a: number
    b: number
    pointIndex: number
    calType: string
  }

  /** 写校准参数 */
  interface SetCalOpts {
    /** 1：通道校准 2：设置AB值 3：工装校准 4：清除校准值 5:复检 6:关闭输出 */
    type: number
    masterId: number
    slaverId: number
    channelIds: number[]
    /** 1：充电电压 2：充电电流 3：放电电流 */
    calType?: string
    /** 电压/电流(修调点) */
    pointer?: number
    abList?: AbListItem[]
  }

  /** 修调点队列 */
  interface CalRangeQueueItem {
    channelIds: number[]
    rangeNum: number
    pointIndex: number
  }

  interface CalCreateTypeList {
    masterId: number
    slaverId: number
    iRange: number[]
    uRange: number[]
    calType: string[]
  }
}
