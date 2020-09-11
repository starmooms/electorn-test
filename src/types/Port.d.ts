// import SerialPort from 'serialport'

declare namespace Port {
  // type Item = SerialPort.PortInfo

  interface ChannelItem {
    id: number
    name: string
    samp: null | SampItem
    workerStart: number | null
    workerEnd: number | null
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

  /** 采样 */
  interface SampItem {
    slaverId: number
    channelId: number
    workerCode: string
    workerId: number
    U: number
    I: number
    endStatus: number
    errorCode: string
    errorMsg: string
    workerStatus: { name: string; status: string }
    createTime: number
    /**  */
    createTimeStr?: string
  }

  /** 通道状态改变时触发 */
  interface ChannelChangeItem {
    masterId: number
    slaverId: number
    channelId: number
    start: number | null
    end: number | null
  }

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
}
