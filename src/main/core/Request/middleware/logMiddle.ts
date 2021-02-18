import { CommuniClass } from '../Communi'
import logger from '../../Logger'

export default function(communi: CommuniClass) {
  communi.middleware.add(function(next) {
    next()
  })
}
