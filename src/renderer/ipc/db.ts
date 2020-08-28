import $command from '@/renderer/command'
import { SettingStatus } from '../store/modules/Setting'

export async function mode(channel: string, ...args: any[]) {
  const path = SettingStatus.portPath
  if (!SettingStatus.portPath) {
    const msg = '请先设置串口'
    $command.errorMsg(msg)
    return { status: false, err: msg }
  }
  return $command.invoke(channel, path, ...args)
}

export async function getSamp(data: any) {
  return mode('/db/getSamp', data)
}
