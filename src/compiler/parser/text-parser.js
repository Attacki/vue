/* @flow */

// 对定界符中的文本进行处理

import { cached } from 'shared/util'
import { parseFilters } from './filter-parser'

// 使用形如(?:pattern)的正则就可以避免保存括号内的匹配结果，就是结果中不保留分组匹配的内容
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g   // 默认定界符
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g    // 界定符替换

// replace函数的第二参数中的'$&'代表被正则匹配的内容，加双\\为的是转义对应的元字符，因为这些对应的符号都属于元字符，有特殊含义，必须要被转义。
// 而使用构造函数创建正则表达式，更适合自定义界定符，但是构造函数不接受字面量正则，只接受字符串，所以元字符都必须进行双重转义，
// 例如：/\d.\d{1,2}/   "\\d.\\d{1,2}"
const buildRegex = cached(delimiters => {
  const open = delimiters[0].replace(regexEscapeRE, '\\$&')
  const close = delimiters[1].replace(regexEscapeRE, '\\$&')
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
})

type TextParseResult = {
  expression: string,
  tokens: Array<string | { '@binding': string }>
}

export function parseText (
  text: string,
  delimiters?: [string, string]
): TextParseResult | void {
  const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE    // delimters如果提供了，就使用用户提供的界定符
  if (!tagRE.test(text)) {  // 是否复合定界符规则
    return
  }
  const tokens = []
  const rawTokens = []
  let lastIndex = tagRE.lastIndex = 0
  let match, index, tokenValue
  // 假如text是 "{{start.count}} ++ {{love}}"
  while ((match = tagRE.exec(text))) {
    index = match.index // 匹配成功的起始位置
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index))
      tokens.push(JSON.stringify(tokenValue))
    }
    // tag token
    const exp = parseFilters(match[1].trim()) // start.count
    tokens.push(`_s(${exp})`)
    rawTokens.push({ '@binding': exp })
    lastIndex = index + match[0].length
  }
  // tookens ["_s(start.count)", "" ++ "", "_s(love)"]
  // rawTokens [{@binding: "start.count"},"++",{@binding: "love"}]
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex))
    tokens.push(JSON.stringify(tokenValue))
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}
