declare namespace UtilT {
  interface StepFormatItem {
    id: number
    showId: number
    loopNum: number
    loopId: string
    type: string
    code: string
    input: {
      [key: string]: number
    }
    msg: string
  }

  /** 格式化数据库中的工步列表 */
  type StepFormatList = StepFormatItem[]

  interface StartInfoFormat
    extends Omit<
      Db.StartInfo,
      'stepList' | 'features' | 'protect' | 'dataSave'
    > {
    stepList: StepFormatList
    features: ipcReq.WriteSteps['features']
    protect: ipcReq.WriteSteps['protect']
    dataSave: ipcReq.WriteSteps['dataSave']
    masterIdArr: number[]
    masterIdShowStr: string
    slaverIdArr: number[]
    slaverIdShowStr: string
    channelIdArr: number[]
    channelIdShowStr: string
  }
}
