declare namespace UtilT {
  interface StepFormatItem {
    id: number
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
}
