/**
 * 校验ip
 */
export const checkIp = (ip: string) => {
  return /^((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}$/.test(
    ip
  )
}
