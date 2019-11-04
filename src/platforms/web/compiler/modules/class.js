/* @flow */

import { parseText } from 'compiler/parser/text-parser'
import {
  getAndRemoveAttr,
  getBindingAttr,
  baseWarn
} from 'compiler/helpers'

// 该文件是为了处理dom的class属性

// 处理ast节点的staticClass和classBinding属性
function transformNode (el: ASTElement, options: CompilerOptions) {
  const warn = options.warn || baseWarn
  const staticClass = getAndRemoveAttr(el, 'class') //获取class属性
  if (process.env.NODE_ENV !== 'production' && staticClass) {
    //生产环境下
    const res = parseText(staticClass, options.delimiters)
    // 这里只是解析一下，预判用户可能写错语法了，<div class="{{ val }}"> 
    if (res) {
      warn(
        `class="${staticClass}": ` +
        'Interpolation inside attributes has been removed. ' +
        'Use v-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.',
        el.rawAttrsMap['class']
      )
    }
  }
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass)
  }
  const classBinding = getBindingAttr(el, 'class', false /* getStatic */)
  if (classBinding) {
    el.classBinding = classBinding
  }
}

// 返回拼好的class
function genData (el: ASTElement): string {
  let data = ''
  if (el.staticClass) {
    data += `staticClass:${el.staticClass},`
  }
  if (el.classBinding) {
    data += `class:${el.classBinding},`
  }
  // 将静态的class属性和bind的class进行拼接
  return data
}

export default {
  staticKeys: ['staticClass'],
  transformNode,
  genData
}
