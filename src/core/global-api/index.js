/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => { // Vue的config选项不可被配置
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 暴露工具方法，这些是不被视为公共API的部分，除非你意识到它们的风险，否则不要依赖它们
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // Vue的函数
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 数据响应式捕获
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  Vue.options = Object.create(null)
  {/* 为 'component','directive','filter' 三项添加容器 */}
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  
  Vue.options._base = Vue

  // 将用户注册的组件和Vue内建的组件(KeepAlive、Transition、TransitionGroup等组件)合并
  extend(Vue.options.components, builtInComponents)
  
  initUse(Vue)    // 扩展插件功能
  initMixin(Vue)  // 合并mixin到当前实例的options中，例如将某个组件的mixin混合到另一个组件
  initExtend(Vue) 
  initAssetRegisters(Vue)
}
