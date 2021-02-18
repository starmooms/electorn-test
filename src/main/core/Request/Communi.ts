import { ERROR_STATUS } from '@/shared/config/port'
import agreement, { ReadResult, SendRestul } from '@/main/core/Agreement'
import SerialPortRequest from '@/main/core/Request/SerialPortRequest'
import configManage from '@/main/core/ConfigManage'
import mainDb from '@/main/core/sqlite/MainDb'
import TcpRequest from '@/main/core/Request/TcpRequest'
import logger from '@/main/core/Logger'
import Middleware from './middleware'
import logMiddle from './middleware/logMiddle'

interface PostOpts {
  timeout?: number
  data: Buffer
  control: {
    code: number
    name: string
  }
  masterId: number
  requestType?: Communi['requestType'] | 'calTool' | null
}

export interface RequestStatus {
  masterId: number
  isWait: boolean
}

export type RequestType = 'Port' | 'Tcp'
export type SetError = (msg: string) => void

export declare type CommuniEmitList = Map<string, (result: ReadResult) => any>

/** 通讯方式 */
class Communi {
  emitList: CommuniEmitList = new Map()
  requestType: RequestType = 'Tcp'
  tpcRequest = new TcpRequest(this)

  portPath!: string
  serialPort: SerialPortRequest | null = null

  middleware!: Middleware<[PostOpts, SendRestul], () => Promise<Buffer>>

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

  post(opts: PostOpts) {
    opts = {
      ...{
        requestType: this.requestType,
        timeout: 5000
      },
      ...opts
    }
    const send = agreement.createData({
      slaverId: 0xff,
      type: 0x02,
      masterId: opts.masterId,
      code: opts.control.code,
      data: opts.data
    })

    return this.middleware.start(() => this.setPost(opts, send), opts, send)
  }

  private setPost(opts: PostOpts, send: SendRestul) {
    return new Promise<Buffer>((resolve, reject) => {
      const { control, requestType, timeout, masterId } = opts
      let timer: NodeJS.Timeout // eslint-disable-line
      const { sId, buf: sendBuf } = send
      const status: RequestStatus = {
        isWait: true,
        masterId
      }

      const setError: SetError = (msg: string) => {
        this.emitList.delete(sId)
        status.isWait = false

        let headMsg = ''
        if (requestType === 'Port') {
          headMsg += this.serialPort!.path
          if (this.serialPort) {
            this.serialPort.handleError()
          }
        } else if (requestType === 'Tcp') {
          const tcpClient = this.tpcRequest.getClient(masterId)
          if (tcpClient) {
            headMsg += tcpClient.ip
          }
        }
        reject(new Error(`${headMsg} POST_ERROR ${msg}`))
        clearTimeout(timer)
      }

      this.emitList.set(sId, ({ masterId, errCode, buf, originBuf, check }) => {
        if (!check) {
          logger.error('checkCrc Error', originBuf.toString('hex'))
          return setError('通讯校验码错误')
        }
        if (errCode !== '00') {
          const errMsg = ERROR_STATUS[errCode] || errCode
          mainDb.saveErrorList([
            {
              masterId: masterId,
              slaverIds: '',
              channelIds: '',
              type: 1,
              action: control.name,
              errCode: errCode
            }
          ])
          return setError(`Error_Code ${errMsg}`)
        }
        resolve(buf)
        clearTimeout(timer)
      })

      timer = setTimeout(() => {
        setError(`${requestType} Time Out`)
      }, timeout || 5000)

      if (requestType === 'Port') {
        if (!this.serialPort) {
          return setError('串口未初始化')
        }
        this.serialPort.post(sendBuf, setError)
      } else if (requestType === 'Tcp') {
        this.tpcRequest.post(sendBuf, setError, status)
      } else if (requestType === 'calTool') {
        this.tpcRequest.calToolPost(sendBuf, setError, status)
      } else {
        setError(`requestType ${requestType} No Found`)
      }
    })
  }

  /** 数据返回 */
  onEmit(buf: Buffer) {
    const result = agreement.readData(buf)
    const fun = this.emitList.get(result.sId)
    if (fun) {
      fun(result)
      this.emitList.delete(result.sId)
      return
    }
    logger.warn(`流水号回调${result.sId} 不存在`)
  }

  addMiddle() {
    logMiddle(this)
  }
}

const communi = new Communi()

export declare type CommuniClass = typeof communi
export default communi
