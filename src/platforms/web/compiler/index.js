/* @flow */

import {
    isPreTag,  // 是否是pre标签
    mustUseProp, // 必须使用Prop
    isReservedTag, // 被浏览器保留的标签
    getTagNamespace  // 获取标签命名空间，svg和math
} from '../util/index'
import { genStaticKeys, makeMap } from 'shared/util'

import modules from './modules/index'
import directives from './directives/index'
import { createCompiler } from 'compiler/index'

// 单闭合标签
const isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
)

// 自动闭合标签，也可以手动闭合
const canBeLeftOpenTag = makeMap(
  'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
)

// compile的基本属性
const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,
  directives,
  isPreTag,
  isUnaryTag,
  mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace,
  staticKeys: genStaticKeys(modules)
}

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
