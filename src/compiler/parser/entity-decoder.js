/* @flow */

let decoder

export default {
  decode (html: string): string {
    decoder = decoder || document.createElement('div')
    decoder.innerHTML = html
    return decoder.textContent  // 获取标签中的html的文本
  }
}
