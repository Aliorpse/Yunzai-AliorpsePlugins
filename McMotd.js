//插件作者3521766148
//开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import { segment } from "oicq"
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
        let res = await fetch("http://123.60.141.159/?ip=" + ip + "&port=" + port)
        if (!res) { return false }
        res = await res.json()
        if (res.hasOwnProperty("errMessage") === true) {
            e.reply(res.errMessage, true)
        }
        let base64img = res.favicon.replace(/\\/g, "").replace(/data:image\/png;base64,/, "")
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
                segment.image(`base64://${base64img}`),
                `${desc1}`,
                `\n----\n[版本] ${res.version.name}`,
                `\n[协议] ${res.version.protocol}`,
                `\n[类型] ${type}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
                `\n[获取模式] 1`,
            ]
            e.reply(message, true)
        } else {
            if (res.hasOwnProperty("modinfo") === false) {
                type = "Vanilla"
            } else {
                type = res.modinfo.type
            }
            var length = res.description.extra.length;
            for (var i = 0; i < length; i++) {
                desc3 = desc3 + res.description.extra[i].text
            }
            const message = [
                segment.image(`base64://${base64img}`),
                `${desc3}`,
                `\n----\n[版本] ${res.version.name}`,
                `\n[协议] ${res.version.protocol}`,
                `\n[类型] ${type}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
                `\n[获取模式] 2`,
            ]
            e.reply(message, true)
        }
    }
}
