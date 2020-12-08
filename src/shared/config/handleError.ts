export enum ErrorEnum {
  TipsError = 'TipsError',
  TCPError = 'TCPError'
}

/**
 * TipsError 一般错误提示
 * @param message 错误信息
 */
export class TipsError extends Error {
  name = ErrorEnum.TipsError

  constructor(msg: string) {
    super(msg)
  }
}

export default {
  TipsError
}
