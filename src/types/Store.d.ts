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

  interface LevelItem {
    desc: string
    vol_min: number
    vol_max: number
    time_min: number
    time_max: number
    epower_min: number
    epower_max: number
    startU_min: number
    startU_max: number
    endU_min: number
    endU_max: number
    avgU_min: number
    avgU_max: number
    endI_min: number
    endI_max: number
    curIRate_min: number
    curIRate_max: number
    t1_min: number
    t1_max: number
    c1_min: number
    c1_max: number
    t2_min: number
    t2_max: number
    c2_min: number
    c2_max: number
    t3_min: number
    t3_max: number
    c3_min: number
    c3_max: number
    t4_min: number
    t4_max: number
    c4_min: number
    c4_max: number
    t5_min: number
    t5_max: number
    c5_min: number
    c5_max: number
  }

  /** 分容设置 */
  interface SeparatConfig {}
}
