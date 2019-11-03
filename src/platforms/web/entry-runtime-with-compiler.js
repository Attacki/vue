/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'  // 测试组件渲染所需时间  使用了window.performance对象可以记录两个标记之间的时间差

import Vue from './runtime/index'
import { query } from './util/index'  // 根据el获取dom模版
import { compileToFunctions } from './compiler/index'  // 模版编译为函数
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat' // ie在a标签的href属性值中需要另起一行，而其他浏览器则不用

// 根据el获取dom模版
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

// 如果没有传递el属性，就要自己使用$mount方法进行挂载
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  // 不允许模版为body或者documentElement
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }
  // 获取用户传入的实例属性参数
  const options = this.$options
  
  // 根据template或者el，获取内容字符串，并且转换成渲染函数
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        // 如果是字符串，并且是dom的id属性
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        // 如果是nodeType  1 Element 2 Attr 3 Text 8 注释
        template = template.innerHTML
      } else {
        // 无效的template或者el，并没能获取到模版
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 转化成字符串
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        // 开始进行编译了，打一个标记
        mark('compile')
      }

      // 编译成函数，获取render函数
      const { render, staticRenderFns } = compileToFunctions(template, {
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        // 编译结束了，再打一个标记
        mark('compile end')
        // 打印出编译耗时
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */

//  element  DOM接口的outerHTML属性获取描述元素（包括其后代）的序列化HTML片段
// 人话就是，将el指向的标签转换成字符串，包括子标签
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
