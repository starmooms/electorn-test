import is from 'electron-is'
import logger from 'electron-log'
import dayjs from 'dayjs'
import * as path from 'path'
import * as fs from 'fs'

// const COLORS = {
//   unset: '\x1b[0m',
//   black: '\x1b[30m',
//   red: '\x1b[31m',
//   green: '\x1b[32m',
//   yellow: '\x1b[33m',
//   blue: '\x1b[34m',
//   magenta: '\x1b[35m',
//   cyan: '\x1b[36m'
// }

// const styles = {
//   error: COLORS.red,
//   wran: COLORS.yellow,
//   info: COLORS.cyan,
//   debug: COLORS.green
// }
const styles = {
  error: 'red',
  wran: 'yellow',
  info: 'cyan',
  debug: 'green'
}

export const logPath = logger.transports.file.getFile().path
logger.transports.file.level = is.production() ? 'debug' : 'silly' // error, warn, info, verbose, debug, silly
logger.transports.file.maxSize = 2 * 1024 * 1024
logger.transports.file.archiveLog = (file: any) => {
  const oldPath = file.toString()
  const { dir, name, ext } = path.parse(oldPath)
  try {
    const date = dayjs().format('YYYY-MM-DD_HH-mm-ss')
    fs.renameSync(oldPath, path.join(dir, `${name}${date}.old${ext}`))
  } catch (e) {
    console.error('Could not rotate log', e)
    const quarterOfMaxSize = Math.round(logger.transports.file.maxSize / 4)
    file.crop(Math.max(quarterOfMaxSize, 256 * 1024))
  }
}

logger.transports.console.level = logger.transports.file.level
if (is.dev()) {
  logger.transports.console.useStyles = true
  // logger.hooks.push((message, transport) => {
  //   if (transport === logger.transports.console) {
  //     const level = message.level
  //     const color = styles[level]
  //     if (color) {
  //       const data = message.data
  //       const colorData: string[] = []
  //       data.forEach(s =>
  //         typeof s === 'string'
  //           ? colorData.push(`%c${s}`, `color:${color}`)
  //           : colorData.push(s)
  //       )
  //       message.data = colorData
  //     }
  //     return message
  //   }
  //   return message
  // })
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
logger.info('Logger init', 'ssseee')

export default logger
export { sysLog, now as sysLognow, sysFilePath, createSysLog }
