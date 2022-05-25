import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  // 执行Vue.prototype._init()方法
  this._init(options)
}
initMixin(Vue)
// $data,$props,$set,$delect,$watch
stateMixin(Vue)
// $on,$off,$once,$emit
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
export default Vue
