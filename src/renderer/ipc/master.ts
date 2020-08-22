import $command from '@/renderer/command'
import { SettingStatus } from '../store/modules/Setting'

interface BasePortData {
  path: string
}

interface SetProtect {
  form: any
}

export async function MasterMode(...args: any[]) {
  const path = SettingStatus.portPath
  if (!SettingStatus.portPath) {
    const msg = '请先设置串口'
    $command.errorMsg(msg)
    return { status: false, err: msg }
  }
  return $command.invoke(`/port/masterMode`, path, ...args)
}

export function setProtect(data: SetProtect) {
  return MasterMode('setProtect', data)
}

// export function setStoreConfig(data: ConfigSet) {
//   return $command.invoke(`/config/set`, data)
// }

// export function delStoreConfig(data: ConfigSet) {
//   return $command.invoke(`/config/del`, data)
// }
