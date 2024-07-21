/**
 * 我的世界 多功能服务器状态查询 支持基岩,Java,可以添加群聊默认服务器
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import fetch from 'node-fetch'
import fs from "fs"

const regexMotd = /^#motd(.*)/
const regexAdd = /^#mcsadd(.*)/
const regexMds = /^#mds(.*)/

if (!fs.existsSync("./data/McMotd/SAlias.json")) {
    fs.mkdirSync("./data/McMotd")
    fs.writeFileSync("./data/McMotd/SAlias.json","{}")
}

if (!fs.existsSync("./data/McMotd/config.json")) {
    fs.writeFileSync("./data/McMotd/config.json","{\"mds\":\"Java\"}")
}

let mode = fs.readFileSync("./data/McMotd/config.json")
mode = eval("(" + mode + ")")

let alias = fs.readFileSync("./data/McMotd/SAlias.json");
alias = eval("(" + alias + ")")

export class McMotd extends plugin {
    constructor() {
        super({
            name: 'McMotd',
            dsc: '查询Minecraft服务器MOTD',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: regexMotd,
                    fnc: 'getMotd'
                },
                {
                    reg: regexAdd,
                    fnc: 'addAlias'
                },
                {
                    reg: regexMds,
                    fnc: 'prioritySwitch'
                }
            ]
        })
    }
    async prioritySwitch(e) {

        mode = fs.readFileSync("./data/McMotd/config.json")
        mode = eval("(" + mode + ")")

        const content = e.msg.match(regexMds)[1].replace(/\s/g, '')

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

        alias = fs.readFileSync("./data/McMotd/SAlias.json");
        alias = eval("(" + alias + ")")

        const content = e.msg.match(regexAdd)[1].replace(/\s/g, '')

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

        mode = fs.readFileSync("./data/McMotd/config.json")
        mode = eval("(" + mode + ")")

        alias = fs.readFileSync("./data/McMotd/SAlias.json");
        alias = eval("(" + alias + ")")

        let serverType = mode.mds

        let content = e.msg.match(regexMotd)[1].replace(/\s/g, '')

        if (content == "") {
            if (e.group_id in alias){
                content = alias[e.group_id]
            }else{
                e.reply(
                    `用法: #motd [IP Address]\n你可以通过"#mcsadd [IP Address]"来增设本群默认服务器`
                    ,true)
                return
            }
        }
        
        if (content.match(/127\..*/) || content == "localhost"){
            e.reply("不支持查询回环地址")
            return true
        }

        let startime = performance.now()
        let res = await fetch(`https://api.mcstatus.io/v2/status/${mode.mds}/` + content)
        if (!res) { return false }
        res = await res.json()



        if(res.online == false) {
            if (mode.mds == "Java"){
                res = await fetch(`https://api.mcstatus.io/v2/status/bedrock/` + content)
                serverType = "bedrock"
                res = await res.json()
            }else{
                res = await fetch(`https://api.mcstatus.io/v2/status/java/` + content)
                serverType = "java"
                res = await res.json()
            }
        }

        let time = ((performance.now() - startime)/1000).toFixed(2)

        if(res.online == false){
            e.reply(`所查的服务器不在线\n查询IP: ${content}`,true)
            return false
        }

        if(serverType == "java"){

            let srvRecord = "无"
            let serverImg = ""
            let eulaBlocked = "否"

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
                `\n----`,
                `\n[IP] ${content}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
                `\n[版本] ${serverType} | ${res.version.name_clean}[${res.version.protocol}]`,
                `\n[SRV记录] ${srvRecord}`,
                `\n[Mojang屏蔽] ${eulaBlocked}`,
                `\n[请求耗时] ${time}s`,
            ]

            e.reply(message,true)

        }else{

            let eulaBlocked = "否"

            if (res.eula_blocked == true) {
                eulaBlocked = "是"
            }

            const message = [
                res.motd.clean,
                `\n----`,
                `\n[IP] ${content}`,
                `\n[玩家] ${res.players.online}/${res.players.max}`,
                `\n[版本] ${serverType} | ${res.version.name}[${res.version.protocol}]`,
                `\n[Mojang屏蔽] ${eulaBlocked}`,
                `\n[请求耗时] ${time}s`,
            ]

            e.reply(message,true)

        }

        return true

    }
}