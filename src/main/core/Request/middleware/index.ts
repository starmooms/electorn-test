declare type NextFun<T> = () => Promise<T>
declare type RunFun<T extends any[], N> = (...args: T) => Promise<N>
declare type middleFun<T extends any[], N> = (
  next: NextFun<N>,
  ...args: T
) => Promise<N>
// declare type PromiseResolve<T> = T extends Promise<infer R> ? R : never

class Middleware<T extends any[], N> {
  list: middleFun<T, N>[] = []

  add(fun: middleFun<T, N>) {
    this.list.push(fun)
  }

  async run(action: RunFun<T, N>, ...args: T) {
    let useAction = false
    let next = () => {
      useAction = true
      return action(...args)
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const lastNext = next
      const item = this.list[i]
      next = () => Promise.resolve(item(lastNext, ...args))
    }

    const result = await next()

    if (!useAction) {
      throw new Error('next no use')
    }

    return result
  }
}

export default Middleware
