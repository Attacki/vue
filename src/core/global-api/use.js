/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 如果插件列表已经有了该插件，就不再安装，直接返回
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)  // 去除第一项，并将类数组转化为数组
    args.unshift(this)  // 将插件添加进插件列表
    if (typeof plugin.install === 'function') {
      // 如果插件有install方法
      plugin.install.apply(plugin, args)  
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
