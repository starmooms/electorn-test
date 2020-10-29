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

const getExcludSql = (keyList: string[]) => {
  return keyList.map(key => `${key}=excluded.${key}`).join(',')
}

const getKeyAllTpl = (
  target: any,
  conflictKey: string[],
  noUpdateKey: string[]
) => {
  const allKeys = Object.keys(target)
  const valKey = allKeys.filter(key => !conflictKey.includes(key))
  const updateKey = valKey.filter(key => !noUpdateKey.includes(key))
  return {
    baseSql1: `(${allKeys.join(',')}) VALUES`,
    baseSql2: `ON CONFLICT(${conflictKey.join(',')}) DO UPDATE SET`,
    valKey,
    updateKey,
    allKeys
  }
}

/**
 * 获取不存在inser，存在则update语句 批量处理
 * 根据第一个insert进入的对象，生成需要写入的value属性
 * @tabelName 表名
 * @conflictKey 主键或唯一键key
 * @noUpdateKey 触发update时不需要更新的key
 *  */
export const getInsertOrUpdateAllTpl = (
  tabelName: string,
  conflictKey: string[],
  noUpdateKey: string[] = []
) => {
  let keyTpl: null | ReturnType<typeof getKeyAllTpl> = null
  const insertList: string[] = []
  return {
    insert: (target: any) => {
      if (!keyTpl) {
        keyTpl = getKeyAllTpl(target, conflictKey, noUpdateKey)
      }
      insertList.push(`(${getKeyValSql(target, keyTpl.allKeys)})`)
      return true
    },
    getSql: () => {
      if (insertList.length > 0 && keyTpl) {
        return `INSERT INTO ${tabelName} ${keyTpl.baseSql1} ${insertList.join(
          ','
        )} ${keyTpl.baseSql2} ${getExcludSql(keyTpl.updateKey)};`
      }
      return ''
    }
  }
}

/**
 * 工步统计表 插入更新对象 设置好主键和不需要update的key
 * @param tabelName 表面
 */
export const getStaticInsert = (tabelName: string) => {
  return getInsertOrUpdateAllTpl(
    tabelName,
    ['fullId', 'stepId', 'loopNum'],
    ['masterId', 'slaverId', 'channelId']
  )
}

// const getUpDateValSql = (target, keyList: string[]) => {
//   return keyList.map(key => `${key}=${target[key]}`).join(',')
// }
// const getKeyTpl = (target: any, conflictKey: string[]) => {
//   const allKeys = Object.keys(target)
//   const valKey = allKeys.filter(key => !conflictKey.includes(key))
//   return {
//     baseSql1: `(${allKeys.join(',')}) VALUES (`,
//     baseSql2: `) ON CONFLICT(${conflictKey.join(',')}) DO UPDATE SET `,
//     valKey,
//     allKeys
//   }
// }
// /** 获取不存在inser，存在则update语句 */
// export const getInsertOrUpdateTpl = (conflictKey: string[]) => {
//   let keyTpl: null | ReturnType<typeof getKeyTpl> = null
//   return (target: any) => {
//     if (!keyTpl) {
//       keyTpl = getKeyTpl(target, conflictKey)
//     }
//     return `${keyTpl.baseSql1}${getKeyValSql(target, keyTpl.allKeys)}${
//       keyTpl.baseSql2
//     }${getUpDateValSql(target, keyTpl.valKey)}`
//   }
// }

// export const getInsertOrUpdate = (target: any, conflictKey: string[]) => {
//   const fun = getInsertOrUpdateTpl(conflictKey)
//   return fun(target)
// }

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
