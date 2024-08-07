/**
 * 我的世界正版玩家信息查询插件
 * #mcinfo [PlayerName]
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import fetch from 'node-fetch'

const regex = /^#mcinfo(.*)/

export class McInfo extends plugin {
    constructor() {
        super({
            name: 'McInfo',
            dsc: '获取mc正版玩家信息',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: regex,
                    fnc: 'getInfo'
                }
            ]
        })
    }

    async getInfo(e) {
        /** 提取需要查询用户的名称 */
        const content = e.msg.match(regex)[1].replace(/\s/g, '')
        if (!content) return e.reply('用法:#mcinfo [PlayerName]', true) // 输入为空提示

        /** 从接口获取数据 */
        const urlData = await (await fetch("https://api.mojang.com/users/profiles/minecraft/" + content)).json()
        if (!urlData) { return false } // 接口返回异常继续向下
        if (urlData.hasOwnProperty("errorMessage")){
            return e.reply(`Error: ${urlData.errorMessage}`,true)
        }

        /** 获取皮肤并处理数据 */
        let skin = ""
        try{
            skin = (await (await fetch(`https://visage.surgeplay.com/bust/${urlData.id}`,{headers:{'User-Agent': 'YunzaiMCPlayerInfo/1.0'}})).arrayBuffer())
            skin = Buffer.from(skin).toString('base64')
        }catch(err){
            return e.reply("错误: 解析失败\n" + err,true)
        }
        e.reply([`MC正版玩家查询\n----\n[玩家] ${urlData.name}\n[UUID] ${urlData.id}\n[皮肤]`,
            segment.image(`base64://${skin}`)], true) // 发送结果
            return true
    }
}