/* @flow */

import { inBrowser } from 'core/util/index'

// 该文件是检查当前浏览器是否在属性值内编码字符

let div
function getShouldDecode (href: boolean): boolean {
  div = div || document.createElement('div')
  div.innerHTML = href ? `<a href="\n"/>` : `<div a="\n"/>`
  return div.innerHTML.indexOf('&#10;') > 0   // &#10;是换行字符
}

// #3663: IE在属性值中也会编码新行，而其他浏览器则不会
export const shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false
// #6828: chrome在a标签的href属性中编码内容
export const shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false
