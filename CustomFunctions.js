/**
 * 一些对我的yunzai有用的功能，自行删减来开关功能
 * nmjqr：屏蔽土块插件gpt
 * 表情帮助：拓展土块表情列表
 * send：创建分段文本,使用逗号隔开(无法与MsgProcess.js一起使用)
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'

const regexSend = /^#send(.*)/

export class custom extends plugin {
    constructor () {
      super({
        name: 'custom',
        dsc: 'none',
        event: 'message',
        priority: -1,
        rule: [
          {
            reg: '机器人',
            fnc: 'nmjqr'
          },
          {
            reg: '#表情帮助',
            fnc: 'bqbz'
          },
          {
            reg: regexSend,
            fnc: 'send'
          }
        ]
      }
      )
    }

    async nmjqr(e){
      return true
    }

    async bqbz(e){
      e.reply("多个文字参数使用空格隔开,关键词与参数用空格隔开\n例如: batitle 1 2\n表情列表: https://github.com/MeetWq/meme-generator/wiki/%E8%A1%A8%E6%83%85%E5%88%97%E8%A1%A8",true)
      return true
    }

    async send(e){
      let array = e.msg.split(",")
      array[0] = array[0].replace("#send ", "")
      let i = 0
      while (i < array.length) {
        if (array[i].includes("\\n")) {
          array[i] = array[i].replace(/\\n/g, "\n")
        }
        i += 1
      }
      e.reply(array)
      return true
    }
}