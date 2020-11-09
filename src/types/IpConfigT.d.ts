declare namespace IpConfigT {
  /** 返回ip列表 */
  interface IpTcpItem {
    ip: string
    masterId: number
    masterInfo: MasterInfo
  }

  /** 从控信息 */
  interface SlaverInfoItem {
    version: string
    slaverId: number
    machineId: string
  }

  /** 主控信息 */
  interface MasterInfo {
    version: string
    masterId: number
    machineId: string
    ip: string
    mask: string
    gateway: string
    slaverList: SlaverInfoItem[]
    /** 1: 未连接 2：已连接 3：连接失败 4:链接成功，请求超时未返回 */
    status: number
    /** 错误信息 */
    errMsg: string
  }
}
