declare namespace SampTB {
  interface ChPostion {
    masterId: number
    slaverId: number
    channelId: number
  }

  /** 采样通用工步数据 */
  interface SampStepData extends ChPostion {
    workerCode: string
    stepId: number
    U: number
    I: number
    vol: number
    epower: number
  }

  /** 采样通用状态数据 */
  interface SampStatusData {
    loopNum: number
    stepTime: number
    errorCode: string
    endCode: string
    createTime: string
  }

  /** 通道状态改变时触发 */
  interface ChannelChangeItem extends ChPostion {
    time: string
    status: 'RUN' | 'END'
    filePath: string
    isUpdateFile: boolean // 触发文件路径更新，但不改变status
  }

  type SampBase = SampStepData & SampStatusData

  /** 采样 */
  interface SampItem extends SampBase {
    errorMsg: string
    workerStatus: { name: string; status: string }
    projectId: number
  }

  /** 采样启动列表 */
  type SampStart = SampBase

  /** 采样结束列表列表 */
  type SampEnd = SampBase

  /** 采样特征列表 */
  interface SampFeature extends SampBase {
    featureType: number
  }

  /** 采样后数据根据工程id分类存储 */
  interface SaveSampItem {
    projectId: number
    sampList: SampItem[]
    changeStatusList: ChannelChangeItem[]
    startList: SampStart[]
    endList: SampEnd[]
    featureList: SampFeature[]
    /** 非工步结束的特殊的结束列表 */
    specialList: SampEnd[]
  }

  interface SaveSampData {
    [projectId: string]: SaveSampItem
  }

  type GetProjectSampKey = keyof SaveSampItem
  type GetProjectSamp = <T extends GetProjectSampKey>(
    porjectId: number,
    key: T
  ) => SaveSampItem[T]
}
