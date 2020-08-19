import is from 'electron-is'
import logger from 'electron-log'

export const logPath = logger.transports.file.findLogPath()
logger.transports.file.level = is.production() ? 'silly' : 'silly'
logger.info('[Motrix] Logger init')
logger.warn('[Motrix] Logger init')

export default logger
