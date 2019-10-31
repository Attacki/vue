/* @flow */

// 冻结一个对象，使其不可修改
export const emptyObject = Object.freeze({})

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.

// %checks只是为了保证该函数可以放在if（）判断当中
export function isUndef (v: any): boolean %checks { 
  // 判断是否为 undefined或者null
  return v === undefined || v === null
}

export function isDef (v: any): boolean %checks {
  // 判断是否被定义了
  return v !== undefined && v !== null
}

export function isTrue (v: any): boolean %checks {
  return v === true
}

export function isFalse (v: any): boolean %checks {
  return v === false
}

//  判断是否是基本数据类型
export function isPrimitive (value: any): boolean %checks {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

// 判断是否是对象
export function isObject (obj: mixed): boolean %checks {
  return obj !== null && typeof obj === 'object'
}

const _toString = Object.prototype.toString
// 确定数据类型
export function toRawType (value: any): string {
  return _toString.call(value).slice(8, -1)
}

// 判断是否是对象
export function isPlainObject (obj: any): boolean {
  return _toString.call(obj) === '[object Object]'
}

// 判断是否是正则表达式
export function isRegExp (v: any): boolean {
  return _toString.call(v) === '[object RegExp]'
}

// 判断是否是数组的序数
export function isValidArrayIndex (val: any): boolean {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

// 判断是否是promise对象
export function isPromise (val: any): boolean {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

// 将输入强制转换为字符串
export function toString (val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
      ? JSON.stringify(val, null, 2)
      : String(val)
}

// 将输入转换为数字，如果失败，将返回原输出
export function toNumber (val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}



// 第一个参数是字符串，类似 'a,b,c'， 创建一个map，然后返回一个函数判断是否包含对应的键名，第二个参数表示是返回的函数接受的参数是否为小写
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  // &和|本是位运算符，之所以可以进行"逻辑运算"，是由于JS是无类型的语言、各数据类型可以自由转换这一特性决定的，
  // 当用&和|进行"逻辑运算"时，实际上true被转换成1，false被转换成0，再进行逐位运算
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

// 判断一个标签是否是Vue的内建标签
export const isBuiltInTag = makeMap('slot,component', true)

// 判断一个属性是否是被Vue保留的属性
export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

// 删除数组的某一项
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

// 判断对象是否含有某属性，原型属性不算在内
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object | Array<*>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

// 创建纯函数的缓存版本。
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}

// 将连字符分隔的字符串，转换为驼峰表示法  start-little  => startLittle ,并且缓存该字符串的驼峰表示
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

// 将字符串的首字母大写，并缓存
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.
 */

//  将字符串转化为驼峰表示
const hyphenateRE = /\B([A-Z])/g  //正则中\b是单词边界匹配符，\B是非单词边界匹配符，只要不是数字，字母或者下划线都算一个边界
export const hyphenate = cached((str: string): string => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

// 为bind函数打补丁
function polyfillBind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

// 绑定定义的函数到指定的上下文
function nativeBind (fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}

// 为bind函数打补丁
export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind

// 将类数组转化为真正的数组
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

// 将一个对象属性混合到另一个对象的属性中去，如果有同名属性，后面属性会覆盖前面属性
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

// 将一个数组中所有对象合并在一起
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/* eslint-disable no-unused-vars */

//  空操作
export function noop (a?: any, b?: any, c?: any) {}

// 总返回false
export const no = (a?: any, b?: any, c?: any) => false

// 返回原值
export const identity = (_: any) => _

/**
 * Generate a string containing static keys from compiler modules.
 */
// 从需要编译的模块中，获取所有的静态属性，生成一个","隔开的字符串
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */

// 检查两个值是否是大致相等，如果都是对象数据类型，是否有相同的属性值，必须
export function looseEqual (a: any, b: any): boolean {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) { //是数组
        return a.length === b.length && a.every((e, i) => {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) { //是日期
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) { //是对象，但不是数组
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return keysA.length === keysB.length && keysA.every(key => {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

// 判断一个值是否在一个数组，如果在，返回序号，如果不再，返回-1
export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

// 确保只被执行一次的函数
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}
