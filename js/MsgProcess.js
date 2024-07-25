/**
 * 处理消息，合并多段文本为一段
 */

export class Intercept extends plugin {
  constructor() {
    super({
      name: 'MsgProcess',
      dsc: '处理消息',
      event: '*',
      priority: Number.NEGATIVE_INFINITY
    })
  }

  mergeTextElements(arr) {
    let result = []
    let tempText = ''
    if(arr.length == undefined){ return arr }
    for (let i = 0; i < arr.length; i++) {
      if (typeof arr[i] === 'string') {
        tempText += arr[i]
      } else {
        if (tempText) {
          result.push(tempText)
          tempText = ''
        }
        result.push(arr[i])
      }
    }
  
    if (tempText) {
      result.push(tempText)
    }
  
    return result
  }

  accept() {
    let reply = this.e.reply
    this.e.reply = (...args) => {
      if(args.includes("\"type\":\"node\"")){
        return reply(...args)
      }
      if(args.includes(true)){
        return reply((this.mergeTextElements(...args)),true)
      }
      return reply(this.mergeTextElements(...args))
    }
  }
}
