/**
 * 拦截违禁词插件的升级版，自动处理优化内容格式
 * 将分段文本合并成一段文本发送，以防止DOMParser的一些问题
 * 不会处理转发消息
 */

export class Intercept extends plugin {
    constructor () {
      super({
        name: 'MsgProcess',
        dsc: '处理消息，拦截违禁词',
        event: '*',
        priority: Number.NEGATIVE_INFINITY
      })
      /** 检查的关键词 */
      this.keywords = ['tcjb']
    }

    accept () {

      let checkStr = [
        this.e.msg,
        this.e.raw_message,
        this.e.file?.name,
        this.e.sender?.card,
        this.e.sender?.nickname
      ]
  
      for (let str of checkStr) {
        if (this.checkStr(str)) {
          return 'return'
        }
      }
  
      let reply = this.e.reply
      this.e.reply = this.checkReply(reply)
      
    }
  
    checkStr (str) {
      for (let keyword of this.keywords) {
        if (str?.includes(keyword)) return true
      }
    }
    
    mergeTextElements(arr) {
      let result = []
      let tempText = ''
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

    checkReply (reply) {
      return (...args) => {
        let msg = args[0]
        if (typeof msg == 'object') {
          msg = JSON.stringify(msg)
        }
        if (this.checkStr(`${msg}`)) {
          logger.error('消息发送失败: 包含违禁词')
          return false
        }
        logger.info(msg)
        if(msg.includes("\"type\":\"node\"")){
          return reply(...args)
        }
        return reply(this.mergeTextElements(...args))
      }
    }
  }