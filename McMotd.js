/**
插件作者3521766148
开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/

使用教程:
#motd [IP] / 获取服务器状态
支持输入端口,例如mc.hypixel.net,mc.hypixel.net:25565都是合法的
如果不输入端口默认端口为25565
*/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import { segment } from "oicq"
import fetch from 'node-fetch'
import fs from "fs"


if (!fs.existsSync("./data/McMotd/SAlias.json")) {
    fs.mkdirSync("./data/McMotd")
    fs.writeFileSync("./data/McMotd/SAlias.json","{}")
}



export class McMotd extends plugin {
    constructor() {
        super({
            name: 'McMotd',
            dsc: '查询Minecraft服务器MOTD',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: '#motd',
                    fnc: 'getMotd'
                },
                {
                    reg: '#mcsadd',
                    fnc: 'addAlias'
                }
            ]
        })
    }
    async addAlias(e) {

        var alias = fs.readFileSync("./data/McMotd/SAlias.json")
        alias = eval("(" + alias + ")")
        const content = e.message[0].text.slice(8)

        if (content == "") {
            e.reply('用法: #mcsadd [IP Address],仅限群聊',true)
            return
        }

        if(!e.isGroup) { 
            e.reply('该功能仅限群聊',true)
            return
        }

        if((e.sender.role == "admin" || e.sender.role == "owner" || e.isMaster)) {
            alias[`${e.group_id}`] = content
            fs.writeFileSync("./data/McMotd/SAlias.json",JSON.stringify(alias))
            e.reply(`添加成功: ${e.group_id}=>${content}`,true)
            return
        }else{
            e.reply('该功能仅限群管理或主人',true)
            return
        }

    }

    async getMotd(e) {
        let eulaBlocked = "否"
        let srvRecord = "无"
        let serverImg = ""
        var alias = fs.readFileSync("./data/McMotd/SAlias.json")
        alias = eval("(" + alias + ")")
        let content = e.message[0].text.slice(6)

        if (content == "") {
            if (e.group_id in alias){
                content = alias[`${e.group_id}`]
            }else{
                e.reply(
                    `用法: #motd [IP Address]\n你可以通过"#mcsadd [IP Address]"来增设本群默认服务器`
                ,true)
                return
            }
          }

        let startime = performance.now()
        let res = await fetch("https://api.mcstatus.io/v2/status/java/" + content)
        let endtime = performance.now()
        let ping = ((endtime - startime) / 1000).toFixed(2)

        if (!res) { return false }

        res = await res.json()

        if (res.online == false){
            e.reply(`错误: 服务器不在线\n查询IP: ${content}`,true)
            return false
        }

        if (res.icon == null) {
            serverImg = "https://api.mcstatus.io/v2/icon"
        }else{
            serverImg = res.icon.replace(/data:image\/png;base64,/, "base64://")
        }

        if (res.srv_record != null) {
            srvRecord = res.srv_record.host + ":" + res.srv_record.port
        }
        
        if (res.eula_blocked == true) {
            eulaBlocked = "是"
        }

        const message = [
            segment.image(serverImg),
            res.motd.clean,
            `\n----\n[IP] ${content}`,
            `\n[玩家] ${res.players.online}/${res.players.max}`,
            `\n[版本] ${res.version.name_clean}`,
            `\n[协议] ${res.version.protocol}`,
            `\n[SRV记录] ${srvRecord}`,
            `\n[Mojang屏蔽] ${eulaBlocked}`,
            `\n[请求耗时] ${ping}s`,
        ]

        e.reply(message,true)
        return true

    }
}
