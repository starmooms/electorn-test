import agreement, { ReadResult, SendRestul } from '@/main/core/Agreement'
import SerialPortRequest from '@/main/core/Request/SerialPortRequest'
import configManage from '@/main/core/ConfigManage'
import TcpRequest from '@/main/core/Request/TcpRequest'
import logger from '@/main/core/Logger'
import Middleware from './middleware'
import logMiddle from './middleware/logMiddle'
import errMiddle from '@/main/core/Request/middleware/errMiddle'

interface PostOpts {
  timeout?: number
  data: Buffer
  control: {
    code: number
    name: string
  }
  masterId: number
  requestType?: Communi['requestType'] | 'calTool'
}
export interface RequestStatus {
  masterId: number
  isWait: boolean
}
export type RequestType = 'Port' | 'Tcp'
export declare type CommuniEmitList = Map<string, (result: ReadResult) => any>
export type Request = {
  opts: PostOpts
  send: SendRestul
}
export type Response = {
  sId: string
  data: ReadResult
}

/** 通讯方式 */
export class Communi {
  emitList: CommuniEmitList = new Map()
  requestType: RequestType = 'Tcp'
  tpcRequest = new TcpRequest(this)

  portPath!: string
  serialPort: SerialPortRequest | null = null

  middleware = new Middleware<[Request], Response>()

  constructor() {
    this.addMiddle()
  }

  createSerialPort() {
    if (this.requestType !== 'Port') {
      this.serialPortClose()
      return
    }
    const lastPortPath = this.portPath
    this.portPath = configManage.userConfig.get('base.portPath')
    if (lastPortPath !== this.portPath || !this.serialPort) {
      this.serialPortClose()
      if (this.portPath && this.requestType === 'Port') {
        this.serialPort = new SerialPortRequest(this.portPath, this)
      }
    }
  }

  serialPortClose() {
    if (this.serialPort) {
      this.serialPort.close()
      this.serialPort = null
    }
  }

  /**
   * tcp 打开关闭
   * @param connectIp 是否创建连接
   */
  async createTcpRequest(connectIp: boolean) {
    if (this.requestType === 'Tcp') {
      if (connectIp) {
        await this.tpcRequest.createdConnect()
      }
    } else {
      this.tpcRequest.close()
    }
  }

  /**
   * 根据设置生成连接
   * @connectIp 是否主动连接ip
   */
  async updateConfig(connectIp = false) {
    const lastType = this.requestType
    this.requestType = configManage.userConfig.get('base.requestType')
    this.createSerialPort()
    await this.createTcpRequest(connectIp || lastType !== this.requestType) // 如果通讯类型没变化，不需要主动重连tcp
    return
  }

  async post(opts: PostOpts) {
    opts = {
      ...{
        timeout: 5000
      },
      ...opts
    }

    if (!opts.requestType) {
      opts.requestType = this.requestType
    }

    const send = agreement.createData({
      slaverId: 0xff,
      type: 0x02,
      masterId: opts.masterId,
      code: opts.control.code,
      data: opts.data
    })

    const response = await this.middleware.run(this.setPost.bind(this), {
      opts,
      send
    })
    return response.data.buf
  }

  private setPost({ opts, send }: Request) {
    return new Promise<Response>((resolve, reject) => {
      const { requestType, timeout, masterId } = opts
      let timer: NodeJS.Timeout // eslint-disable-line
      const { sId, buf: sendBuf } = send
      const status: RequestStatus = {
        isWait: true,
        masterId
      }

      const clearStatus = () => {
        status.isWait = false
        clearTimeout(timer)
        this.emitList.delete(sId)
      }

      const setError = (err: Error) => {
        clearStatus()
        reject(err)
      }

      this.emitList.set(sId, data => {
        clearStatus()
        resolve({ sId, data })
      })

      timer = setTimeout(() => {
        setError(new Error(`${requestType} Time Out`))
      }, timeout || 5000)

      // 发送
      ;(async () => {
        try {
          switch (requestType) {
            case 'Port':
              if (!this.serialPort) throw new Error('串口未初始化')
              await this.serialPort.post(sendBuf)
              break
            case 'Tcp':
              await this.tpcRequest.post(sendBuf, status)
              break
            case 'calTool':
              await this.tpcRequest.calToolPost(sendBuf, status)
              break
            default:
              throw new Error(`requestType ${requestType} No Found`)
          }
        } catch (err) {
          if (status.isWait) {
            setError(err)
          } else {
            err.message = `WAIT_OUT_ERR ${err.message}`
            logger.error(err)
          }
        }
      })()
    })
  }

  /** 数据返回 */
  onEmit(buf: Buffer) {
    const result = agreement.readData(buf)
    const fun = this.emitList.get(result.sId)
    if (fun) {
      fun(result)
      return
    }
    logger.warn(`流水号回调${result.sId} 不存在`)
  }

  addMiddle() {
    errMiddle(this)
    logMiddle(this)
  }
}

const communi = new Communi()

export default communi
