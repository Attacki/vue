/* @flow */

import { dirRE, onRE } from './parser/index'    // 指令绑定和绑定事件的正则判断

type Range = { start?: number, end?: number };

// these keywords should not appear inside expressions, but operators like
// typeof, instanceof and in are allowed
// 禁止使用已经被占用的关键字，如下关键字不能出现在表达式里面，但是typeof instanceof还有in等操作符可以出现。
const prohibitedKeywordRE = new RegExp('\\b' + (
  'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
  'super,throw,while,yield,delete,export,import,return,switch,default,' +
  'extends,finally,continue,debugger,function,arguments'
).split(',').join('\\b|\\b') + '\\b')

// these unary operators should not be used as property/method names
// 如下的一元操作符，不能被用来作为属性名和方法名
const unaryOperatorsRE = new RegExp('\\b' + (
  'delete,typeof,void'
).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)')

// strip strings in expressions
// 验证是否是字符串 ''  ""  ``的格式
// 在字符串中\具有特殊含义，例如 \n 等等，所以需要转义
const stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g

// detect problematic expressions in a template
// 发现模版中导致错误的表达式
export function detectErrors (ast: ?ASTNode, warn: Function) {
  if (ast) {  // 如果没有生成ast树
    checkNode(ast, warn)
  }
}

// 检查ASTNode
function checkNode (node: ASTNode, warn: Function) {
  if (node.type === 1) {  // element元素节点
    for (const name in node.attrsMap) { // 遍历它的属性集合
      if (dirRE.test(name)) { // 指令属性
        const value = node.attrsMap[name]
        if (value) {  //如果有值
          const range = node.rawAttrsMap[name]
          if (name === 'v-for') { // for循环
            checkFor(node, `v-for="${value}"`, warn, range)
          } else if (name === 'v-slot' || name[0] === '#') {  // 插槽
            checkFunctionParameterExpression(value, `${name}="${value}"`, warn, range)
          } else if (onRE.test(name)) {   // 事件绑定
            checkEvent(value, `${name}="${value}"`, warn, range)
          } else {  // 检查是否是表达式
            checkExpression(value, `${name}="${value}"`, warn, range)
          }
        }
      }
    }
    if (node.children) { // 对子节点进行递归调用
      for (let i = 0; i < node.children.length; i++) {
        checkNode(node.children[i], warn)
      }
    }
  } else if (node.type === 2) { // 属性节点
    checkExpression(node.expression, node.text, warn, node)
  }
}


// 检查事件命名是否规范
function checkEvent (exp: string, text: string, warn: Function, range?: Range) {
  const stripped = exp.replace(stripStringRE, '')   //先将所有的字符串转化为空
  const keywordMatch: any = stripped.match(unaryOperatorsRE)  // 然后再进行关键字的检测
  if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
    warn(
      `avoid using JavaScript unary operator as property name: ` +  //避免使用js一元运算符
      `"${keywordMatch[0]}" in expression ${text.trim()}`,
      range
    )
  }
  checkExpression(exp, text, warn, range)
}

// 检查节点
function checkFor (node: ASTElement, text: string, warn: Function, range?: Range) {
  checkExpression(node.for || '', text, warn, range)
  checkIdentifier(node.alias, 'v-for alias', text, warn, range)
  checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range)
  checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range)
}

function checkIdentifier (
  ident: ?string,
  type: string,
  text: string,
  warn: Function,
  range?: Range
) {
  if (typeof ident === 'string') {
    try {
      new Function(`var ${ident}=_`)
    } catch (e) {
      warn(`invalid ${type} "${ident}" in expression: ${text.trim()}`, range)
    }
  }
}


function checkExpression (exp: string, text: string, warn: Function, range?: Range) {
  try {
    new Function(`return ${exp}`)
  } catch (e) {
    const keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE)
    if (keywordMatch) {
      warn(
        `avoid using JavaScript keyword as property name: ` +
        `"${keywordMatch[0]}"\n  Raw expression: ${text.trim()}`,
        range
      )
    } else {
      warn(
        `invalid expression: ${e.message} in\n\n` +
        `    ${exp}\n\n` +
        `  Raw expression: ${text.trim()}\n`,
        range
      )
    }
  }
}

// 检查函数式参数表达式
function checkFunctionParameterExpression (exp: string, text: string, warn: Function, range?: Range) {
  try {
    new Function(exp, '')
  } catch (e) {
    warn(
      `invalid function parameter expression: ${e.message} in\n\n` +
      `    ${exp}\n\n` +
      `  Raw expression: ${text.trim()}\n`,
      range
    )
  }
}
