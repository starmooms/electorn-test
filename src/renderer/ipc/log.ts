import $command from '@/renderer/command'

export async function getSysLogInfo() {
  return $command.invoke<ipcReq.SysLogInfo>('/sysLog/sysLogInfo')
}
