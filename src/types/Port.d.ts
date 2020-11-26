// import SerialPort from 'serialport'

declare namespace Port {
  // type Item = SerialPort.PortInfo
  interface ChannelSaveSampTimeData {
    stepTime: number
    masterId: number
    slaverId: number
    channelId: number
    [key: string]: any
  }

  interface ChannelSaveSampTime {
    channel?: ChannelItem
    data: ChannelSaveSampTimeData
  }

  interface ChannelItem {
    id: number
    name: string
    samp: null | SampTB.SampItem
    fullId: string
    workerStart: number | null
    workerEnd: number | null
    status: null | 'RUN' | 'END'
    lastSaveTime: number | null
    filePath: string | null
  }

  interface SlaverItem {
    id: number
    name: string
    list: {
      [key: string]: ChannelItem
    }
  }

  /** 通道列表 */
  type MasterList = {
    [key: string]: {
      id: number
      name: string
      slaverList: {
        [key: string]: SlaverItem
      }
    }
  }

  // /** 采样通用工步数据 */
  // interface SampStepData {
  //   workerCode: string
  //   stepId: number
  //   U: number
  //   I: number
  //   vol: number
  //   epower: number
  // }

  // /** 采样通用状态数据 */
  // interface SampStatusData {
  //   loopNum: number
  //   stepTime: number
  //   createTime: string
  //   errorCode: string
  //   endCode: string
  // }

  // /** 采样 */
  // interface SampItem extends SampStepData, SampStatusData {
  //   masterId: number
  //   slaverId: number
  //   channelId: number
  //   workerCode: string
  //   stepId: number
  //   U: number
  //   I: number
  //   vol: number
  //   epower: number
  //   stepTime: number
  //   loopNum: number
  //   errorCode: string
  //   errorMsg: string
  //   workerStatus: { name: string; status: string }
  //   createTime: string
  //   projectId: number
  //   /**  */
  //   createTimeStr?: string
  // }

  /** 通道状态改变时触发 */
  interface ChannelChangeItem {
    masterId: number
    slaverId: number
    channelId: number
    time: string
    status: 'RUN' | 'END'
    filePath: string
    isUpdateFile: boolean // 触发文件路径更新，但不改变status
  }

  interface ChannelChangeFilePath {
    masterId: number
    slaverId: number
    channelId: number
    filePath: string
  }

  interface ChannelChangeMap {
    [projectId: string]: ChannelChangeItem[]
  }

  interface ErrorListItem {
    masterId: number
    slaverIds: string | number
    channelIds: string | number
    /** 1: 通讯错误 2：实时数据错误列表 */
    type: 1 | 2
    /** 操作名称 */
    action: string
    errCode: string
    params1?: string
    params2?: string
    createTime?: string
  }
  type ErrorList = ErrorListItem[]

  interface BaseError {
    masterId: number
    action: string
    errCode: string
    errMsg: string
    createTime: number
    createTimeStr?: number
  }

  /** 采样错误列表 */
  interface SampErrorItem extends BaseError {
    slaverId: number
    channelId: number
    params1: string
    params2: string
    type: 'SampError'
  }

  /** 通讯错误列表 */
  interface PostError extends BaseError {
    postBuf: string
    backBuf: string
    type: 'PostError'
  }

  type SaveErrorItem = SampErrorItem | PostError
  type SaveError = SaveErrorItem[]

  interface SampEndStatus {
    masterId: number
    slaverId: number
    channelId: number
    stepId: number
    endCode: string
  }
  interface SampEndStatusMap {
    [porjectId: string]: SampEndStatus[]
  }

  /** 工步列表 */
  interface StepInput {
    data: number
    unit: string
    name: string
    type: string
  }

  interface StepListItem {
    id: number
    type: string
    name: string
    worker: StepInput[]
    limt: StepInput[]
  }

  interface Protect {
    UCi: number
    ICi: number
    IDisCi: number
    UMax: number
    UMin: number
    TimeMin: number
    warnVal: number
  }

  type StepsList = StepListItem[]
  interface StepsDataItem {
    protect: Protect
    stepList: StepListItem[]
  }

  interface StepsData {
    stepData: {
      [key: string]: StepsDataItem
    }
  }

  // /** 采样 电压特征 */
  // interface SampFeature extends SampStepData, SampStatusData {
  //   masterId: number
  //   slaverId: number
  //   channelId: number
  //   featureType: number
  // }

  // /** 采样启动列表 */
  // interface SampStart extends SampStepData, SampStatusData {
  //   masterId: number
  //   slaverId: number
  //   channelId: number
  //   stepId: number
  //   workerCode: string
  //   U: number
  // }

  // /** 采样结束列表 */
  // interface SampEnd extends SampStepData, SampStatusData {
  //   masterId: number
  //   slaverId: number
  //   channelId: number
  //   endCode: string
  // }

  // interface SaveSampItem {
  //   projectId: number
  //   sampList: SampItem[]
  //   changeStatusList: ChannelChangeItem[]
  //   startList: SampStart[]
  //   endList: SampEnd[]
  //   featureList: SampFeature[]
  //   /** 非工步结束的特殊的结束列表 */
  //   specialList: SampEnd[]
  // }

  // interface SaveSampData {
  //   [projectId: string]: SaveSampItem
  // }

  /** 校准参数 */
  interface CalItem {
    name: string
    key: string
    index: number
    value: number | string
    nameKey: string
  }

  /** 通道信息，日志 */
  interface ChannelInfo {
    masterId: number
    slaverId?: number
    slaverIds?: number[]
    channel?: number
    channelIds?: number[]
  }

  // type GetProjectSampKey = keyof SaveSampItem
  // type GetProjectSamp = <T extends GetProjectSampKey>(
  //   porjectId: number,
  //   key: T
  // ) => SaveSampItem[T]
}
