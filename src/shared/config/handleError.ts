export enum ErrorEnum {
  TipsError = 'TipsError',
  TcpError = 'TcpError'
}

/**
 * TipsError 一般错误提示
 * @param message 错误信息
 */
export class TipsError extends Error {
  nameInfo = ErrorEnum.TipsError

  constructor(msg: string) {
    super(msg)
  }
}

/**
 * TCP 请求错误
 * @param message 错误信息
 */
export class TcpError extends Error {
  nameInfo = ErrorEnum.TcpError

  constructor(msg: string) {
    super(msg)
  }

  static make(err: Error) {
    err['nameInfo'] = ErrorEnum.TcpError
  }
}

export default {
  TipsError,
  TcpError
}
