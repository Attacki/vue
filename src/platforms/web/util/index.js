/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

// 查找一个element元素

export function query (el: string | Element): Element {
  if (typeof el === 'string') {
    const selected = document.querySelector(el) //根据el属性，获取dom模版
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
