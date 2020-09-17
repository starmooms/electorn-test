/** ipc 通讯相关 */
declare namespace ipcReq {
  interface PortBase {
    path: string
  }

  interface PortMasterBase extends PortBase {
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

  interface StepDataSave {
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

  interface WriteSteps {
    path: string
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
    dataSave: {
      time: StepDataSave
      U: StepDataSave
      I: StepDataSave
    }
    startId: number
    filePath: string
  }
}
