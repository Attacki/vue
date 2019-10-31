/* @flow */

import { makeMap } from 'shared/util'

// 该文件是为了处理对真实dom有特定意义的属性，这些是为web保留的，因为它们是在编译期间直接编译的

// 编译的时候，style，还有class属性需要被保留，交给其他函数进行处理
export const isReservedAttr = makeMap('style,class')

// 可以接收value的tag
const acceptValue = makeMap('input,textarea,option,select,progress')

// 对应标签中如果存在下面对应的attr，必须要保留，不能直接搜集到其他位置，因为这些属性对于该标签具有其他意义
// 例如 <video muted></video>  muted表示对视频进行静音
export const mustUseProp = (tag: string, type: ?string, attr: string): boolean => {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
}

// 是否为以下列举属性中的一个
export const isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck')

// contenteditable可以将标签转换为可编辑的状态，有以下的几种属性值
const isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only')

// 转换列举属性的值，就是因为contenteditable属性的值类别比较多，才分开处理的
export const convertEnumeratedValue = (key: string, value: any) => {
  return isFalsyAttrValue(value) || value === 'false'
    ? 'false'
    // 允许编辑任意的字符串值
    : key === 'contenteditable' && isValidContentEditableValue(value)
      ? value
      : 'true'
}

// 是否是只支持布尔值的属性  例如  visible = "true"
export const isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
)

export const xlinkNS = 'http://www.w3.org/1999/xlink'

export const isXlink = (name: string): boolean => {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
}

export const getXlinkProp = (name: string): string => {
  return isXlink(name) ? name.slice(6, name.length) : ''
}

// 是否为可转换为false的值
export const isFalsyAttrValue = (val: any): boolean => {
  return val == null || val === false
}
