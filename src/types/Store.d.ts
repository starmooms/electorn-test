/** 设置相关 */
declare namespace Store {
  /** 采样曲线设置 */
  interface SampChartConfig {
    y1: string
    y2: string
    y1Limt: {
      min: number
      max: number
    }
    y2Limt: {
      min: number
      max: number
    }
  }

  interface UserConfg {
    sampChartConfig: SampChartConfig
    base: {
      portPath: string
    }
  }
}
