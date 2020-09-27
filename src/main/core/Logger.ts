import is from 'electron-is'
import logger from 'electron-log'
import dayjs from 'dayjs'
import * as path from 'path'
import ipcManage from './IpcManage'
import winManager from './WinManager'

export const logPath = logger.transports.file.getFile().path
logger.transports.file.level = is.production() ? 'silly' : 'silly'
logger.transports.file.maxSize = 2097152

const sysLog = logger.create('sysLog')
const now = dayjs().format(`YYYY-MM-DD HH:mm:ss`) // eslint-disable-line
sysLog.transports.file.maxSize = 1048576 * 10
sysLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}]：{text}'
sysLog.transports.file.resolvePath = variables => {
  return path.join(
    variables.libraryDefaultDir,
    `./sys/${now.replace(/-|:|\s/g, '')}.log`
  )
}
const sysFilePath = sysLog.transports.file.getFile().path
const setLogIpc = () => {
  ipcManage.handle('/sysLog/sysLogInfo', () => {
    return {
      start: now,
      filePath: sysFilePath
    }
  })
}
sysLog.log(`启动系统`)

// sysLog.info(`user Login init ${dayjs().format()}???`)
// setInterval(() => {
//   sysLog.info('???')
// }, 2000)
logger.info('Logger init')
logger.warn('Logger init')

export default logger
export { sysLog, setLogIpc }
