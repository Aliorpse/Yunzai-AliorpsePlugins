/**
插件作者3521766148
开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/

使用教程:
#motd [IP] / 获取服务器状态
#mcsadd [IP] / 添加默认服务器
#mds [Java/Bedrock] / 设置默认优先查询Java或Bedrock
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

if (!fs.existsSync("./data/McMotd/config.json")) {
    fs.writeFileSync("./data/McMotd/config.json","{\"mds\":\"Java\"}")
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
                },
                {
                    reg: '#mds',
                    fnc: 'prioritySwitch'
                }
            ]
        })
    }
    async prioritySwitch(e) {

        var mode = fs.readFileSync("./data/McMotd/config.json")
        mode = eval("(" + mode + ")")
        const content = e.message[0].text.slice(5)

        if (content == "Java" || content == "Bedrock" || content == "java" || content == "bedrock") {
            mode["mds"] = content
            fs.writeFileSync("./data/McMotd/config.json",JSON.stringify(mode))
            e.reply('修改优先查询成功',true)
        }else {
            e.reply('用法: #mds [Java/Bedrock]',true)
        }

        return true

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
            alias[e.group_id] = content
            fs.writeFileSync("./data/McMotd/SAlias.json",JSON.stringify(alias))
            e.reply(`添加成功: ${e.group_id}=>${content}`,true)
            return
        }else{
            e.reply('该功能仅限群管理或主人',true)
            return
        }

    }

    async getMotd(e) {

        let res = ""
        var alias = fs.readFileSync("./data/McMotd/SAlias.json")
        var mode = fs.readFileSync("./data/McMotd/config.json")
        alias = eval("(" + alias + ")")
        mode = eval("(" + mode + ")")
        let serverType = mds.mode
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

            res = await fetch(`https://api.mcstatus.io/v2/status/${mode.mds}/` + content)
            if (!res) { return false }
            res = await res.json()

            if(res.online == false) {
                if (mode.mds == "Java"){
                    res = await fetch(`https://api.mcstatus.io/v2/status/bedrock/` + content)
                    serverType = "bedrock"
                }else{
                    res = await fetch(`https://api.mcstatus.io/v2/status/java/` + content)
                    serverType = "java"
                }
            }

            res = await res.json()
            
            if(res.online == false){
                e.reply(`所查的服务器不在线\n查询IP: ${content}`,true)
                return false
            }

            if(serverType == "java"){

                if (res.icon == null) {
                    serverImg = "https://api.mcstatus.io/v2/icon"
                    }else{
                        let serverImg = res.icon.replace(/data:image\/png;base64,/, "base64://")
                    }
    
                if (res.srv_record != null) {
                    let srvRecord = res.srv_record.host + ":" + res.srv_record.port
                }
            
                if (res.eula_blocked == true) {
                    let eulaBlocked = "是"
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
                    `\n[请求耗时] ${time}s`,
                ]
    
                e.reply(message,true)

            }else{

            }

        return true
    }
}
