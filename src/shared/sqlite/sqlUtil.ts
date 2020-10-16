import is from 'electron-is'
import logger from '@/main/core/Logger'

/** 提示工具 */
export const tipUtil = (msg: string) => {
  if (is.renderer()) {
    alert(msg)
  } else {
    logger.info(msg)
  }
}
