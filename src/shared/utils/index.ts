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

/** 对象合并 */
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

/**
 *
 * @param val 设置对象的内容
 * @param keys 要设置对象的路径索引
 * @param target 源对象
 */
export function setDeep(val: any, keys: string[] | number[], target = {}) {
  let setTarget = target
  if (keys.length >= 2) {
    for (let i = 0; i < keys.length - 1; i++) {
      if (!setTarget[keys[i]]) {
        setTarget[keys[i]] = {}
      }
      setTarget = setTarget[keys[i]]
    }
  }
  setTarget[keys[keys.length - 1]] = val
  return target
}
