import { ERROR_STATUS } from '@/shared/config/port'
import agreement, { ReadResult } from '@/main/core/Agreement'
import SerialPortRequest from '@/main/core/Request/SerialPortRequest'
import configManage from '../ConfigManage'
import mainDb from '../sqlite/MainDb'

interface PostOpts {
  timeout?: number
  data: Buffer
  control: {
    code: number
    name: string
  }
  masterId: number
}

export declare type CommuniEmitList = Map<string, (result: ReadResult) => any>

/** 通讯方式 */
class Communi {
  emitList: CommuniEmitList = new Map()
  requestType: 'Port' | 'Tcp' = 'Port'

  portPath!: string
  serialPort: SerialPortRequest | null = null

  constructor() {
    this.createSerialPort()
    this.changeConfig()
  }

  createSerialPort() {
    const lastPortPath = this.portPath
    this.portPath = configManage.userConfig.get('base.portPath')
    if (lastPortPath === this.portPath) return
    if (this.serialPort) {
      this.serialPort.close()
      this.serialPort = null
    }
    if (this.portPath) {
      this.serialPort = new SerialPortRequest(this.portPath, this.emitList)
    }
  }

  changeConfig() {
    configManage.userConfig.onDidChange('base', () => {
      this.createSerialPort()
    })
  }

  post({ timeout, data, masterId, control }: PostOpts): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const requestType = this.requestType
      const agrData = agreement.createData({
        slaverId: 0xff,
        type: 0x02,
        masterId,
        code: control.code,
        data
      })
      let timer: NodeJS.Timeout // eslint-disable-line

      const sId = agrData.sId
      const setError = (msg: string) => {
        this.emitList.delete(sId)
        let headMsg = ''
        if (this.requestType === 'Port') {
          headMsg += this.serialPort!.path
          this.serialPort!.handleError()
        }
        reject(new Error(`${headMsg} POST Error：${msg}`))
        clearTimeout(timer)
      }

      this.emitList.set(sId, ({ masterId, errCode, buf, originBuf }) => {
        if (errCode !== '00') {
          const errMsg = ERROR_STATUS[errCode]
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

          setError(`Error_Code ${errMsg}`)
          return
        }
        resolve(buf)
        clearTimeout(timer)
      })

      if (this.requestType === 'Port') {
        if (!this.serialPort) {
          setError('串口未初始化')
          return
        }
        this.serialPort.post(agrData.buf, setError)
      } else {
        setError(`requestType ${this.requestType} No Found`)
      }

      timer = setTimeout(() => {
        setError(`${requestType} Time Out`)
      }, timeout || 2000)
    })
  }
}

const communi = new Communi()

export default communi
