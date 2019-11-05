import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// 如果把Vue比作一个炫酷机械装甲战士，人们用它做出各种出色成果。那么这里就是制作Vue的最初地方。
// Vue机械大心脏，一切的荣耀辉煌就从这里开始吧！ 
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    // Vue是一个构造函数，是一个制造机甲的工厂，=.= ， 不可以直接运行哦！
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 根据用户需求，开始制造机甲了
  this._init(options)
}

// 为机甲内置该有的配置，data，props，state，event等等
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
