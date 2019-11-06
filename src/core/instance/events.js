/* @flow */

import {
  tip,
  toArray,
  hyphenate, // 将字符串转化为 kebab-case 表示
  formatComponentName,  // 格式化组件名称
  invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

export function initEvents (vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

let target: any

// 追加事件
function add (event, fn) {
  target.$on(event, fn)
}

// 移除事件
function remove (event, fn) {
  target.$off(event, fn)
}

// 创建一次处理函数
function createOnceHandler (event, fn) {
  const _target = target
  return function onceHandler () {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}


export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, createOnceHandler, vm)
  target = undefined
}

export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/

  // 绑定事件
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    if (Array.isArray(event)) { // 如果是数组，就是相同的事件，绑定同一个回调函数
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn)
      }
    } else {  
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // 优化hook事件的注册，使用布尔值而不是通过哈希查找  （布尔值是基本数据类型处理速度更快，而哈希是通过在对象内存中查找，优化了性能）
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  // 绑定一次性事件
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn  // $off有关于这里的判断 cb.fn === fn ，所以这里是为了保证一次性函数也可以被解绑
    vm.$on(event, on) // 一次性事件绑定
    return vm
  }

  // 移除事件
  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // 如果没有事件列表，删啥删
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    if (Array.isArray(event)) { // event传递的是事件名列表
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    // specific handler
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  // 触发事件
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +  // 因为html是不区分大小写的
          `v-on to listen to camelCase events when using in-DOM templates. ` +    //  不能使用v-on来监听 驼峰类的事件
          `You should probably use "${hyphenate(event)}" instead of "${event}".`  //使用 kebab-case 来表示自定义事件名
        )
      }
    }
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      const info = `event handler for "${event}"`
      for (let i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info)
      }
    }
    return vm
  }
}
