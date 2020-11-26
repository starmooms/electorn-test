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
      [key: string]: SampTB.SampItem[]
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

  interface LampSetOpts {
    list: SortingT.BoxLampResult
  }

  /** IP编辑机柜信息 */
  interface MasterInfoSetOpts {
    masterId: number
    ip: string
    mask: string
    gateway: string
    machineId: string
    ipOld: string
  }

  /** 删除ip机柜 */
  interface MasterInfoDelIp {
    masterId: number
    ip: string
  }

  /** 校准--开始 */
  interface CalStart {
    config: CalibrateT.CalConfSubmitForm
    calType: string[]
  }

  interface CalReadSamp {
    masterId: number
    slaverId: number
    channelIds: number[]
    /** 1：读采样 2：读AB */
    type: number
    calType: string
  }

  interface CalToolReadSamp {
    readCal: CalReadSamp
    config: {
      ip: string
    }
  }

  /** 写校准参数 */
  interface SetCalOpts {
    /** 1：通道校准 2：设置AB值 3：工装校准 4：清除校准值 5:复检 6:关闭输出 */
    type: number
    masterId: number
    slaverId: number
    channelIds: number[]
    /** 1：充电电压 2：充电电流 3：放电电流 */
    calType?: string
    /** 电压/电流(修调点) */
    pointer?: number
    abList?: CalibrateTB.AbListItem[]
  }

  interface CalToolSet {
    setCal: SetCalOpts
    config: {
      ip: string
    }
  }

  interface CalRecheck extends CalStart {
    recheckForm: CalibrateTR.RecheckSumbitForm
    iRange: number[]
    uRange: number[]
  }

  interface UpgradeForm {
    masterIds: number[]
    filePath: string
    /** 1：机柜升级 2：从控升级 */
    upgradeType: 1 | 2
  }
}
