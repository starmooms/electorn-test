import is from 'electron-is'
import logger from 'electron-log'
import dayjs from 'dayjs'
import * as path from 'path'

export const logPath = logger.transports.file.getFile().path
logger.transports.file.level = is.production() ? 'silly' : 'silly'
logger.transports.file.maxSize = 2097152

let sysLog = (logger as unknown) as logger.ElectronLog
let sysFilePath = logPath
let now = ''

/** 创建系统日志 */
const createSysLog = () => {
  sysLog = logger.create('sysLog')
  now = dayjs().format(`YYYY-MM-DD HH:mm:ss`) // eslint-disable-line
  sysLog.transports.file.level = is.renderer() ? false : 'silly'
  sysLog.transports.file.maxSize = 1048576 * 10
  sysLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}]：{text}'
  sysLog.transports.file.resolvePath = variables => {
    return path.join(
      variables.libraryDefaultDir,
      `./sys/${now.replace(/-|:|\s/g, '')}.log`
    )
  }
  sysFilePath = sysLog.transports.file.getFile().path
  sysLog.log(`启动系统`)
}

logger.info('Logger init')
logger.warn('Logger init')

export default logger
export { sysLog, now as sysLognow, sysFilePath, createSysLog }
