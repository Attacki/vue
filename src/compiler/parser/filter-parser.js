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
  // exp = "'start.count:'+start.count"
  let inSingle = false  //单引号
  let inDouble = false  //双引号
  let inTemplateString = false //模版字符串
  let inRegex = false   //正则表达式
  let curly = 0    // 不是{}
  let square = 0   // 不是[]
  let paren = 0    // 不是()
  let lastFilterIndex = 0
  let c, prev, i, expression, filters


  // 这里的所有关于 "" '' {} () []的检测都是为了防止干扰 | 的判断，防止filter的内容出现问题
  // 0x5C => \
  // 0x2f => /
  // 0x7c => |

  // 这里的for循环就是为了处理所有的符号的 例如： [](){}\|/'"`
  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)
    if (inSingle) {
      // ' && \   \这里是为了防止正则中的转义
      if (c === 0x27 && prev !== 0x5C) inSingle = false
    } else if (inDouble) {
      // " && \
      if (c === 0x22 && prev !== 0x5C) inDouble = false
    } else if (inTemplateString) {
      // ` && \
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false
    } else if (inRegex) {
      // / && \  不让\转义/
      if (c === 0x2f && prev !== 0x5C) inRegex = false  //进到个条件，表示正则 / ... / 已经闭合
    } else if (
      // |  这个代表的就是filter的使用方法
      c === 0x7C && // |
      exp.charCodeAt(i + 1) !== 0x7C && //排除 ||
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren   // 例如： paren默认是0 ( 会让 paren++  )会让paren--  这样就保证了一个完整的()，!paren应当保证是false，这样就可以继续向下判断，直到获取了expression。
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
        // 从当前字符的上一个字符向前开始查找，第一个不是空格的字符
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !/[\w).+\-_$\]]/.test(p)) { //这里的inRegex标志不能随意更改，因为会改变表达式语义
          //  \w 可能是变量名，数字或_，当前的/可能表示的是除法
          //  . 同上，还是有可能把/当作除法运算符
          //  + 可能是拼接字符串
          //  - 数学运算，会转化正则为NaN
          //  _ 可能是变量名
          //  $ 可能是变量名
          //  ])会导致表达式，这里判断是为了保证表达式的格式正确，所以如果是[(之类的字符，就可以进入正则
          inRegex = true
        }
      }
    }
  }

  // 说明没有filter 这个时候可以获取表达式
  if (expression === undefined) {
    expression = exp.slice(0, i).trim()
  } else if (lastFilterIndex !== 0) {
  //  如果有表达式，说明有filter
    pushFilter()
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
    lastFilterIndex = i + 1
  }
  // 如果lastFilterIndex没有改变
  if (filters) {
    for (i = 0; i < filters.length; i++) {
      // 不断的把表达式递归嵌套 
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
