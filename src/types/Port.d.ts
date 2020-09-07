// import SerialPort from 'serialport'

declare namespace Port {
  // type Item = SerialPort.PortInfo

  interface ChannelItem {
    id: number
    name: string
    samp: any
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
}
