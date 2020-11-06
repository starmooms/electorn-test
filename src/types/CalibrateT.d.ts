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

  /** 运行校准时的运行新 */
  interface CalRunInfo {
    isRun: boolean
    runType: 1 | 5
    runTypeName: string
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

  /** 创建工装校准参数 */
  interface ToolCalCreateCal {
    selectType: {
      label: string
      type: string
      rangeType: string
      meanwhile: boolean
    }
    selectRange: {
      id: number
      label: string
      value: number[]
    }
  }

  interface ToolCalSampResultItem {
    [point: string]: number | null
  }
  /** 工装校准采样结果 */
  interface ToolCalSampResult {
    [channelId: string]: ToolCalSampResultItem
  }

  interface ToolCalAbResultItem {
    a: number | null
    b: number | null
    point1: number
    point2: number
    pointIndex: number
  }
  interface ToolCalAbResultChItem {
    [pointIndex: string]: ToolCalAbResultItem
  }
  /** 工装校准ab结果 */
  interface ToolCalAbResult {
    [channelId: string]: ToolCalAbResultChItem
  }

  interface ToolCalChannelList {
    channelId: number
    calTypeName: string
    point1: number
    point1Name: string
    point2: number
    point2Name: string
    sampResult: ToolCalSampResultItem
    abResult: ToolCalAbResultItem
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
