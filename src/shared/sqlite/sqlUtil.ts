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

// https://stackoverflow.com/questions/2717590/sqlite-insert-on-duplicate-key-update-upsert
const getKeyValSql = (target, keyList: string[]) => {
  return keyList.map(key => target[key]).join(',')
}
const getUpDateValSql = (target, keyList: string[]) => {
  return keyList.map(key => `${key}=${target[key]}`).join(',')
}

const getKeyTpl = (target: any, conflictKey: string[]) => {
  const allKeys = Object.keys(target)
  const valKey = allKeys.filter(key => !conflictKey.includes(key))
  return {
    baseSql1: `(${allKeys.join(',')}) VALUES (`,
    baseSql2: `) ON CONFLICT(${conflictKey.join(',')}) DO UPDATE SET `,
    valKey,
    allKeys
  }
}

/** 获取不存在inser，存在则update语句 */
export const getInsertOrUpdateTpl = (conflictKey: string[]) => {
  let keyTpl: null | ReturnType<typeof getKeyTpl> = null
  return (target: any) => {
    if (!keyTpl) {
      keyTpl = getKeyTpl(target, conflictKey)
    }
    return `${keyTpl.baseSql1}${getKeyValSql(target, keyTpl.allKeys)}${
      keyTpl.baseSql2
    }${getUpDateValSql(target, keyTpl.valKey)}`
  }
}

export const getInsertOrUpdate = (target: any, conflictKey: string[]) => {
  const fun = getInsertOrUpdateTpl(conflictKey)
  return fun(target)
}

/** 获取fullId并和其他id生成对象, fullId带有‘’号 */
export const getFullIdData = <
  T extends { masterId: number; slaverId: number; channelId: number }
>(
  item: T
) => {
  return {
    masterId: item.masterId,
    slaverId: item.slaverId,
    channelId: item.channelId,
    fullId: `'${item.masterId}_${item.slaverId}_${item.channelId}'`
  }
}
