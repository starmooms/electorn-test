import cp from 'child_process'
import OS from 'os'
import path from 'path'
import logger from '../Logger'

const numCPUs = OS.cpus().length

for (let i = 0; i < 1; i++) {
  const child = cp.fork(path.join(__dirname, 'child.js'))
  child.on('exit', () => {
    logger.info('退出')
  })
}
