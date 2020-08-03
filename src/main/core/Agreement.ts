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
      crc = (crc >> 8) ^ buf[i]
      for (let j = 0; j < 8; j++) {
        const temp = crc & 0x01
        crc >>= 0x0001
        if (temp == 0x01) {
          crc ^= 0xa001
        }
      }
    }
    return crc
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
    const dataLenByt = this.PrefixZero(dataLen.toString(16), 4)
    const dataLenBuf = Buffer.from(dataLenByt, 'hex')

    let sId = this.getId().toString(16)
    sId = this.PrefixZero(sId, 4)
    const sIdNumber = (`0x${sId}` as unknown) as number

    const header = Buffer.from([
      0x68,
      0x03,
      0x01,
      0xff,
      0xff,
      0x68,
      code,
      0x00,
      sIdNumber
    ])
    const resultBufArr = [header, dataLenBuf]
    if (dataLen > 0 && dataBuf) {
      resultBufArr.concat(dataBuf)
    }
    const checkData = Buffer.concat(resultBufArr)
    const end = Buffer.from([this.crc16(checkData), 0x16])
    const resutl = Buffer.from([resultBufArr.push(end)])
    return resutl
  }
}

const agreement = new Agreement()
export default agreement
