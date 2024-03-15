/**
插件作者3521766148
开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/

使用教程:
#mcinfo [Name] / 获取Java正版玩家信息
*/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import { segment } from "oicq"
import fetch from 'node-fetch'

/** 指令正则 */
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
        const urlData = await (await fetch("https://playerdb.co/api/player/minecraft/" + content)).json()
        if (!urlData) { return false } // 接口返回异常继续向下
        if (!urlData['success']) return e.reply(`错误:${urlData['message']}`) // 接口success数据返回false结束并返回提示

        /** 获取皮肤并处理数据 */
        const skin = (await (await fetch(`http://minecraft-api.com/api/skins/${urlData.data.player.username}/body/10.5/10/10/25/3`)).text()).replace(/<img src="data:image\/png\;base64, /, "").replace(/" alt="Minecraft-API.com skin player" \/>/, "")
        e.reply([`MC正版玩家查询\n----`,
            `\n[玩家] ${urlData.data.player.username}`,
            `\n[UUID] ${urlData.data.player.id}`,
            `\n[皮肤]`,
            segment.image(`base64://${skin}`)], true) // 发送结果
    }
}