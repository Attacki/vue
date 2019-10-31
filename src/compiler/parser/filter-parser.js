/* @flow */

// \u则代表unicode编码，是一个字符；
// 0x开头代表十六进制，实际上就是一个整数；
// \x对应的是UTF-8编码的数据，通过转化规则可以转换为Unicode编码，就能得到对应的汉字，转换规则很简单，先将\x去掉，转换为数字;
// 'lang'.charCodeAt(2) == 0x6e

// 有效分割字符的正则表达式
// []里面的字符都代表自己本身的含义，但有例外，-表示连续的意思（a-z），所以需要转义\-
const validDivisionCharRE = /[\w).+\-_$\]]/

// 解析过滤器
export function parseFilters (exp: string): string {
  let inSingle = false  //单引号
  let inDouble = false  //双引号
  let inTemplateString = false //模版字符串
  let inRegex = false   //正则表达式
  let curly = 0
  let square = 0
  let paren = 0
  let lastFilterIndex = 0
  let c, prev, i, expression, filters

  // 0x5C => \
  // 0x2f => /
  // 0x7c => |

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)
    if (inSingle) {
      // ' && \
      if (c === 0x27 && prev !== 0x5C) inSingle = false
    } else if (inDouble) {
      // " && \
      if (c === 0x22 && prev !== 0x5C) inDouble = false
    } else if (inTemplateString) {
      // ` && \
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false
    } else if (inRegex) {
      // / && \
      if (c === 0x2f && prev !== 0x5C) inRegex = false
    } else if (
      // | && \
      c === 0x7C && // pipe
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1
        expression = exp.slice(0, i).trim()
      } else {
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break         // "
        case 0x27: inSingle = true; break         // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break                 // (
        case 0x29: paren--; break                 // )
        case 0x5B: square++; break                // [
        case 0x5D: square--; break                // ]
        case 0x7B: curly++; break                 // {
        case 0x7D: curly--; break                 // }
      }
      if (c === 0x2f) { // /
        let j = i - 1
        let p
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
    pushFilter()
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i])
    }
  }

  return expression
}

function wrapFilter (exp: string, filter: string): string {
  const i = filter.indexOf('(')
  if (i < 0) {
    // _f: resolveFilter
    return `_f("${filter}")(${exp})`
  } else {
    const name = filter.slice(0, i)
    const args = filter.slice(i + 1)
    return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
  }
}
