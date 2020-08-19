declare type typedKeys = <T>(o: T) => Array<keyof T>
/** 可以返回类型的 Object.keys */
export const typedKeys = Object.keys as typedKeys

/** 深拷贝 */
export function deepClone<T extends Record<string, any>>(source: T): T {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments deepClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj as T
}

export function merge<T, S>(source1: T, source2: S): T & S {
  const getValue = (target: any, key: string, value: any) => {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = value.constructor === Array ? [] : {}
      }
      Object.keys(value).forEach(vKey =>
        getValue(target[key], vKey, value[vKey])
      )
    } else {
      target[key] = value
    }
  }

  const targetObj: any = {}
  ;[source1, source2].forEach(source => {
    Object.keys(source).forEach(key => {
      getValue(targetObj, key, source[key])
    })
  })
  return targetObj
}
