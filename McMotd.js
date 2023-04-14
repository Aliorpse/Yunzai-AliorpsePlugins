//插件作者3521766148
//开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import { segment } from "oicq"
import fetch from 'node-fetch'
const _path = process.cwd();

export class McMotd extends plugin {
    constructor() {
        super({
            name: 'McMotd',
            dsc: '查询Minecraft服务器MOTD',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '#motd.*$',
                    fnc: 'getMotd'
                }
            ]
        })
    }

    async getMotd(e) {
        const content = e.message[0].text.slice(6)
        if (content == "") return
        let ip = content.substring(0, content.indexOf(":"))
        let port = content.replace(content.substring(0, content.indexOf(":") + 1), "")
        if (port == content) {
            ip = port
            port = 25565
        }
        let res = await fetch("http://123.60.141.159/api/mcPing?ip=" + ip + "&port=" + port)
        if (!res) { return false }
        res = await res.json()
        logger.mark(`${res}`)
        if (res == false){
            e.reply(`错误: 意外的返回数据(这通常是服务器的问题)`, true)
            return
        }
        if (res.hasOwnProperty("errMessage") === true) {
            e.reply(res.errMessage, true)
            return
        }
        let serverimg = ""
        if (res.hasOwnProperty("favicon") === true) {
            serverimg = res.favicon.replace(/\\/g, "").replace(/data:image\/png;base64,/, "base64://")
        }else{
            serverimg = "http://123.60.141.159/api/mcPing/favicons/defaultServerIcon.png"
        }
        let desc3 = ""
        let desc2 = "1"
        let desc1 = "1"
        let type = "1"
        if (_.isString(res.description) === true) {
            desc2 = res.description + "\u00a7a"
            desc1 = desc2.replace(/\u00a7+\w/g, "")
            if (res.hasOwnProperty("modinfo") === false) {
                type = "Vanilla"
            } else {
                type = res.modinfo.type
            }
            const message = [
                segment.image(`${serverimg}`),
                `${desc1}`,
                `\n----\n[版本] ${res.version.name}`,
                `\n[协议] ${res.version.protocol}`,
                `\n[类型] ${type}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
            ]
            e.reply(message, true)
        } else {
            if (res.hasOwnProperty("modinfo") === false) {
                type = "Vanilla"
            } else {
                type = res.modinfo.type
            }
            if(res.description.hasOwnProperty("extra")){
                var length = res.description.extra.length;
                for (var i = 0; i < length; i++) {
                    desc3 = desc3 + res.description.extra[i].text
                }
            }else{
                desc2 = res.description.text + "\u00a7a"
                desc3 = desc2.replace(/\u00a7+\w/g, "")
            }
            const message = [
                segment.image(`${serverimg}`),
                `${desc3}`,
                `\n----\n[版本] ${res.version.name}`,
                `\n[协议] ${res.version.protocol}`,
                `\n[类型] ${type}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
            ]
            e.reply(message, true)
        }
    }
}
