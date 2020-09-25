import $command from '@/renderer/command'

interface ConfigBase {
  type: string
  key?: string
}

interface ConfigSet {
  type: string
  key?: string
  data?: any
}

export function getStoreConfig(data: ConfigBase) {
  return $command.invoke(`/config/get`, data)
}

export function setStoreConfig(data: ConfigSet) {
  return $command.invoke(`/config/set`, data)
}

export function delStoreConfig(data: ConfigSet) {
  return $command.invoke(`/config/del`, data)
}

export function beforeRender() {
  return $command.invoke(`/startRender`)
}
