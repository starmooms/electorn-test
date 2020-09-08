import $command from '@/renderer/command'
import { SettingStatus } from '../store/modules/Setting'

export async function mode<T = any>(channel: string, ...args: any[]) {
  const path = SettingStatus.portPath
  if (!SettingStatus.portPath) {
    const msg = '请先设置串口'
    $command.errorMsg(msg)
    return { status: false, err: msg } as ipcReq.ResponseError
  }
  return $command.invoke<T>(channel, path, ...args)
}

export async function getSamp(data: any) {
  return mode<ipcReq.SampReadDB>('/db/getSamp', data)
}

export async function getChannelHistory(data: any) {
  return mode('/db/history', data)
}
