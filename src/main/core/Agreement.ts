import { toHex, FixZero } from '../utils'

class Agreement {
  // constructor() {}

  /**
   * 自定义函数名：PrefixZero
   * @param num： 被操作数
   * @param n： 固定的总位数
   */
  PrefixZero(num: string | number, n: number) {
    return (Array(n).join('0') + num).slice(-n)
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
    return crc & 0xff
  }

  getId() {
    const max = 65535
    const min = 0
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  setData(data: string, code = 0x00) {
    let dataBuf: Buffer | null = null
    let dataLen = 0
    if (data) {
      dataBuf = Buffer.from(data, 'hex')
      dataLen = dataBuf.length
    }
    const dataLenByt = toHex(dataLen, 2)
    const dataLenBuf = Buffer.from(dataLenByt, 'hex')

    // 流水号
    const sId = toHex(this.getId(), 2)
    const sIdBuf = Buffer.from(sId, 'hex')

    const header = Buffer.from([0x68, 0x03, 0x01, 0xff, 0xff, 0x68, code, 0x00])
    const resultBufArr = [header, sIdBuf, dataLenBuf]
    if (dataLen > 0 && dataBuf) {
      resultBufArr.push(dataBuf)
    }
    const checkData = Buffer.concat(resultBufArr)
    const end = Buffer.from([0x00, 0x00, 0x16])
    end.writeUIntBE(this.crc16(checkData), 0, 2)
    resultBufArr.push(end)
    const resutl = Buffer.concat(resultBufArr)
    this.readData(resutl)
    return resutl
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
    console.log('帧结束符：', getResult(result[sIndex + 2]))
  }

  readData(buf: Buffer) {
    const dataStart = 12
    const dataLen = buf.readUInt16BE(10)
    const dataEndLen = dataLen + dataStart
    const checkBuf = buf.slice(0, dataEndLen)
    const crc16Buf = buf.readUInt16BE(dataEndLen)
    if (this.crc16(checkBuf) !== crc16Buf) {
      console.log('校验失败')
    }
    console.log('数据域内容', buf.slice(dataStart, dataEndLen))
    return buf.slice(dataStart, dataEndLen)
  }
}

const agreement = new Agreement()
export default agreement
