/* @flow */

// 该文件就是为了处理 vue实例绑定的class属性

import { isDef, isObject } from 'shared/util'

export function genClassForVnode (vnode: VNodeWithData): string {
  let data = vnode.data
  let parentNode = vnode
  let childNode = vnode
  // 判断是否有子组件实例
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data)
    }
  }
  // 判断是否有父组件实例
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data)
    }
  }
  return renderClass(data.staticClass, data.class)
}

// 合并父子虚拟节点的class
function mergeClassData (child: VNodeData, parent: VNodeData): {
  staticClass: string,
  class: any
} {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class)
      ? [child.class, parent.class]
      : parent.class
  }
}

// 渲染class
export function renderClass (
  staticClass: ?string,
  dynamicClass: any
): string {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

// 拼接两个字符串
export function concat (a: ?string, b: ?string): string {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

// 将任意类型的值转化为字符串
export function stringifyClass (value: any): string {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}

// 将数组转换为以空格为分割的字符串
function stringifyArray (value: Array<any>): string {
  let res = ''
  let stringified
  // 属性绑定中传递数组，要求数组的子项返回字符串，例如： <div :class="[b_switch?'b-switch-on':'']">
  for (let i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) res += ' '
      res += stringified
    }
  }
  return res
}

// 将对象的所有键名转换为以空格为分割的字符串
function stringifyObject (value: Object): string {
  let res = ''
  for (const key in value) {
    // 属性绑定中传递对象，要求对象类型的值为布尔值，例如： <div :class="{default:true}">
    if (value[key]) {
      if (res) res += ' '
      res += key
    }
  }
  return res
}
