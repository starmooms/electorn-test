declare type typedKeys = <T>(o: T) => Array<keyof T>
/** 可以返回类型的 Object.keys */
export const typedKeys = Object.keys as typedKeys
