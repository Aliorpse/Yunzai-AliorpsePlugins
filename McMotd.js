//插件作者3521766148
//开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import * as fs from 'fs'
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
        let res = await fetch("http://123.60.141.159/?ip=" + ip + "&port=" + port) //自建API 不限请求次数,但导致我自己服务器卡顿的话火速关闭 基于php,Lib: https://github.com/xPaw/PHP-Minecraft-Query
        if (!res) { return false }
        res = await res.json()
        if (res.hasOwnProperty("errMessage") === true) {
            e.reply(res.errMessage, true)
            return
        }
        function base64_decode(base64str, file) { //抄的
            var bitmap = new Buffer.from(base64str, 'base64');
            fs.writeFileSync(file, bitmap);
        }
        base64_decode(res.favicon.replace(/\\/g, "").replace(/data:image\/png;base64,/, ""), "servericon.png") //base64解码服务器图片
        let desc3 = ""
        let desc2 = "1"
        let desc1 = "1"
        let type = "1"
        if (_.isString(res.description) === true) { //区分两种description形式
            desc2 = res.description + "\u00a7a" //防止下一句报错，笨办法
            desc1 = desc2.replace(/\u00a7+\w/g, "")
            if (res.hasOwnProperty("modinfo") === false) {
                type = "Vanilla"
            } else {
                type = res.modinfo.type
            }
            const message = [
                segment.image(_path + "/servericon.png"),
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
            for (var i = 0; i < length; i++) { //笨办法，随便改
                desc3 = desc3 + res.description.extra[i].text
            }
            const message = [
                segment.image(_path + "/servericon.png"),
                `${desc3}`,
                `\n----\n[版本] ${res.version.name}`,
                `\n[协议] ${res.version.protocol}`,
                `\n[类型] ${type}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
                `\n[获取模式] 2`,
            ]
            e.reply(message, true)
        }
        return
    }
}
