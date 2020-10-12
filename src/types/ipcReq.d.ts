/** ipc 通讯相关 */
declare namespace ipcReq {
  interface PortMasterBase {
    masterId: number
  }

  interface PortSlaverBase extends PortMasterBase {
    slaverId: number
  }

  interface PortChannelBase extends PortSlaverBase {
    channelId: number
  }

  type PortItem = PortChannelBase

  type ResponseError = {
    status: false
    err?: any
  }

  type Response<T = any> =
    | {
        status: true
        data: T
      }
    | ResponseError

  /** 读采样数据返回 */
  interface SampReadDB {
    [key: string]: {
      [key: string]: Port.SampItem[]
    }
  }

  /** 设置通道状态参数 */
  interface SetStatus {
    path: string
    masterId?: number
    masterIdList?: number[]
    slaverId?: number
    slaverIdList?: number[]
    channelId?: number
    channelIdList?: number[]
    startId?: number
    status: string
  }

  interface Position {
    path: string
    masterId: number
    slaverId: number
    channelId: number
  }

  // /** redis存储历史 */
  // interface ChannelHistory {
  //   [key: string]: {

  //   }
  // }

  interface StepDataSaveItem {
    enable: boolean
    value: null | number
  }

  type ProtectItem = number | null
  interface Protect {
    UCi: ProtectItem
    ICi: ProtectItem
    IDisCi: ProtectItem
    UMax: ProtectItem
    UMin: ProtectItem
    TimeMin: ProtectItem
    warnVal: ProtectItem
  }

  interface StepsDataSave {
    time: StepDataSaveItem
    U: StepDataSaveItem
    I: StepDataSaveItem
  }

  /** 特征电压 */
  interface Features {
    v1: number | null
    v2: number | null
    v3: number | null
    v4: number | null
    v5: number | null
  }

  /** 写工步并启动，传递参数 */
  interface WriteSteps {
    masterIds: number[]
    slaverIds: number[]
    channelIds: number[]
    stepsList: any[]
    protect: {
      UCi: ProtectItem
      ICi: ProtectItem
      IDisCi: ProtectItem
      UMax: ProtectItem
      UMin: ProtectItem
      TimeMin: ProtectItem
      warnVal: ProtectItem
    }
    features: Features
    dataSave: StepsDataSave
    startId: number
    filePath: string
  }

  /** 读工步 */
  interface ReadSteps {
    masterId: number
    slaverId: number
    channelId: number[]
  }

  /** 是否读取采样 */
  interface SampReadStatus {
    status: boolean
  }

  /** 获取日志信息 */
  interface SysLogInfo {
    start: string
    filePath: string
  }

  /** 读校准请求参数 */
  interface CalOpts {
    masterId: number
    slaverId: number
    channelId: number
  }

  /** 写校准请求参数 */
  interface CalWriteOpts extends CalOpts {
    list: Port.CalItem[]
  }

  /** 获取通道列表请求参数 */
  interface ChannelListOpts {
    type?: string
    path: string
    masterId?: number
    slaverId?: number
    channelId?: number
  }

  /** 改变通道状态请求参数 */
  interface ChannelSetStatus {
    path: string
    masterId?: number
    masterIdList?: number[]
    slaverId?: number
    slaverIdList?: number[]
    channelId?: number
    channelIdList?: number[]
    startId?: number
    status: string
  }
}
