import dayjs from 'dayjs'
import { ERROR_STATUS } from '@/shared/config/port'
import agreement, { ReadResult } from '@/main/core/Agreement'
import redisClient from '@/main/core/redis/RedisClient'
import SerialPortRequest from '@/main/core/Request/SerialPortRequest'
import configManage from '../ConfigManage'

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
export default class Communi {
  emitList: CommuniEmitList = new Map()
  requestType: 'Port' | 'Tcp' = 'Port'

  portPath!: string
  serialPort!: SerialPortRequest

  constructor() {
    this.createSerialPort()
  }

  createSerialPort() {
    const lastPortPath = this.portPath
    this.portPath = configManage.userConfig.get('base.portPath')
    if (lastPortPath === this.portPath) return
    if (this.serialPort) {
      this.serialPort.close()
    }
    this.serialPort = new SerialPortRequest(this.portPath, this.emitList)
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
        const headMsg = ''
        // if(requestType === 'port'){
        //   headMsg+= this.port.path
        // }
        reject(new Error(`${headMsg}POST Error：${msg}`))
        clearTimeout(timer)
      }

      this.emitList.set(sId, ({ masterId, errCode, buf, originBuf }) => {
        if (errCode !== '00') {
          const errMsg = ERROR_STATUS[errCode]
          redisClient.saveError([
            {
              postBuf: agrData.buf.toString('hex'),
              backBuf: originBuf.toString('hex'),
              masterId,
              errCode,
              errMsg,
              action: control.name,
              createTime: dayjs().valueOf(),
              type: 'PostError'
            }
          ])
          setError(`Error_Code ${errMsg}`)
          return
        }
        resolve(buf)
        clearTimeout(timer)
      })

      if (this.requestType === 'Port') {
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
