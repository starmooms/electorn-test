declare type NextFun = () => Promise<any>
declare type middleFun<T extends any[], N extends NextFun> = (
  next: N,
  ...args: T
) => N

class Middleware<T extends any[], N extends NextFun = () => Promise<Buffer>> {
  list: middleFun<T, N>[] = []

  add(fun: middleFun<T, N>) {
    this.list.push(fun)
  }

  async start(action: N, ...args: T) {
    let useAction = false
    let result!: ReturnType<N>
    let next: NextFun = async () => {
      useAction = true
      result = await action()
      return result
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const lastNext = next
      const item = this.list[i]
      next = item(lastNext as N, ...args)
    }

    await next()

    if (!useAction) {
      throw new Error('next no use')
    }

    return result
  }
}

export default Middleware
