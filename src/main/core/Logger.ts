import is from 'electron-is'
import logger from 'electron-log'

export const logPath = logger.transports.file.file as string
logger.transports.file.level = is.production() ? 'silly' : 'silly'
logger.info('Logger init')
logger.warn('Logger init')

export default logger
