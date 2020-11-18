import is from 'electron-is'
import logger from 'electron-log'
import dayjs from 'dayjs'
import * as path from 'path'
import * as fs from 'fs'

export const logPath = logger.transports.file.getFile().path
logger.transports.file.level = is.production() ? 'verbose' : 'info' // error, warn, info, verbose, debug, silly
logger.transports.console.level = logger.transports.file.level
logger.transports.file.maxSize = 2 * 1024 * 1024
logger.transports.file.archiveLog = (file: any) => {
  const oldPath = file.toString()
  const inf = path.parse(oldPath)
  try {
    const now = dayjs()
    fs.renameSync(
      oldPath,
      path.join(
        `${inf.dir}`,
        inf.name + `${now.format('YYYY-MM-DD_HH-mm-ss')}` + '.old' + inf.ext
      )
    )
  } catch (e) {
    console.log('Could not rotate log', e)
    const quarterOfMaxSize = Math.round(logger.transports.file.maxSize / 4)
    file.crop(Math.max(quarterOfMaxSize, 256 * 1024))
  }
}

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
