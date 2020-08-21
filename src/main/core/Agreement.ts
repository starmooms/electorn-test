import { toHex, FixZero } from '../utils'

export type ReadDataBack = ReturnType<Agreement['readData']>
export type SetDataBack = ReturnType<Agreement['setData']>
export interface CreateData {
  data?: Buffer | string
  code: number
  type: number
  masterId: number
  slaverId: number
}

class Agreement {
  nowSId = 0
  // constructor() {
  // }

  /** 获取结束帧 */
  getEnd() {
    return Buffer.from('edededed', 'hex')
  }

  crc16(buf: Buffer) {
    let crc = 0xffff
    for (let i = 0; i < buf.length; i++) {
      crc = crc ^ buf[i]
      for (let j = 0; j < 8; j++) {
        const temp = crc & 0x0001
        crc >>= 1
        if (temp) {
          crc ^= 0xa001
        }
      }
    }
    return crc & 0xffff
  }

  getId() {
    const id = this.nowSId
    this.nowSId = this.nowSId >= 65535 ? 0 : this.nowSId + 1
    return id
  }

  setData(data: string | Buffer, code = 0x00) {
    let dataBuf: null | Buffer = null
    if (data) {
      dataBuf = typeof data === 'string' ? Buffer.from(data, 'hex') : data
    }
    const dataLen = dataBuf ? dataBuf.length : 0
    const dataLenByt = toHex(dataLen, 2)
    const dataLenBuf = Buffer.from(dataLenByt, 'hex')

    // 流水号
    const sId = toHex(this.getId(), 2)
    const sIdBuf = Buffer.from(sId, 'hex')

    const header = Buffer.from([0x68, 0x00, 0x01, 0xff, 0xff, 0x68, code, 0x00])
    const resultBufArr = [header, sIdBuf, dataLenBuf]
    if (dataLen > 0 && dataBuf) {
      resultBufArr.push(dataBuf)
    }
    const checkData = Buffer.concat(resultBufArr)
    const check = Buffer.alloc(2)
    check.writeUIntBE(this.crc16(checkData), 0, 2)
    resultBufArr.push(check)
    resultBufArr.push(this.getEnd())
    const buf = Buffer.concat(resultBufArr)
    // console.log('发送', buf)
    // this.readData(buf)
    return { buf, sId }
  }

  createData({ data, code, type, masterId, slaverId }: CreateData) {
    let dataBuf: null | Buffer = null
    if (data) {
      dataBuf = typeof data === 'string' ? Buffer.from(data, 'hex') : data
    }
    const dataLen = dataBuf ? dataBuf.length : 0
    // 流水号
    const sId = this.getId()

    const header = Buffer.from([0x68, type, 0x01, 0xff, 0xff, 0x68, code, 0x00, 0x00, 0x00, 0x00, 0x00]) // eslint-disable-line
    header.writeUInt8(masterId, 3)
    header.writeUInt8(slaverId, 4)
    header.writeUInt16BE(sId, 8)
    header.writeUInt16BE(dataLen, 10)
    const checkData =
      dataLen > 0 && dataBuf ? Buffer.concat([header, dataBuf]) : header
    const check = Buffer.alloc(2)
    check.writeUIntBE(this.crc16(checkData), 0, 2)
    const buf = Buffer.concat([checkData, check, this.getEnd()])
    return {
      buf,
      sId: toHex(sId, 2)
    }
  }

  showDetails(result) {
    function getResult(s, l = 2) {
      return `${FixZero(s.toString(16), l)}`
    }
    function getBufResults(b) {
      let s = ''
      for (let i = 0; i < b.length; i++) {
        s += ` ${getResult(b[i])}`
      }
      return s
    }
    console.log('resutl', result)
    console.log('帧起始符：', getResult(result[0]))
    console.log('从机类型：', getResult(result[1]))
    console.log('版本号：', getResult(result[2]))
    console.log('地址 主控：', getResult(result[3]))
    console.log('地址 从控：', getResult(result[4]))
    console.log('帧起始符：', getResult(result[5]))
    console.log('控制码：', getResult(result[6]))
    console.log('错误码：', getResult(result[7]))
    console.log('流水号：', getBufResults([result[8], result[9]]))
    console.log('数据域长度', getBufResults([result[10], result[11]]))
    // console.log(parseInt(`${result[10]}${result[11]}`, 10))
    const n = parseInt(`${result[10]}${result[11]}`, 10)
    const sIndex = 12 + n
    const data = result.slice(12, sIndex)
    console.log('数据域：', getBufResults(data))
    console.log('校验码：', getBufResults([result[sIndex], result[sIndex + 1]]))
    console.log(
      '帧结束符：',
      getBufResults([result[sIndex + 2], result[sIndex + 6]])
    )
  }

  readData(buf: Buffer) {
    // console.log('接收', buf)
    const dataStart = 12
    const dataLen = buf.readUInt16BE(10)
    // logger.info('readData的buf', buf)
    // console.log('readData的buf', buf)
    // logger.info('数据域长度', dataLen)
    const dataEndLen = dataLen + dataStart
    // const checkBuf = buf.slice(0, dataEndLen)
    // const crc16Buf = buf.readUInt16BE(dataEndLen)
    // if (this.crc16(checkBuf) !== crc16Buf) {
    //   logger.info('校验失败', crc16Buf.toString(16))
    // }
    // logger.info('数据域内容', buf.slice(dataStart, dataEndLen))
    // logger.info('流水号', toHex(buf.readUInt16BE(8), 2))
    return {
      buf: buf.slice(dataStart, dataEndLen),
      sId: toHex(buf.readUInt16BE(8), 2)
    }
  }
}

const agreement = new Agreement()
export default agreement
