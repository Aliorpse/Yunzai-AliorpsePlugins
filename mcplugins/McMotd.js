/**
 * 我的世界 多功能服务器状态查询 支持基岩,Java,可以添加群聊默认服务器
 * #motd [Address]
 * #mcsadd [Address]
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import fetch from 'node-fetch'
import fs from "fs"

const regexMotd = /^#motd(.*)/
const regexAdd = /^#mcsadd(.*)/

if (!fs.existsSync("./data/McMotd/SAlias.json")) {
    fs.mkdirSync("./data/McMotd")
    fs.writeFileSync("./data/McMotd/SAlias.json","{}")
}

let alias = fs.readFileSync("./data/McMotd/SAlias.json")
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
                }
            ]
        })
    }

    async addAlias(e) {
        alias = fs.readFileSync("./data/McMotd/SAlias.json")
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
            e.reply(`添加成功: ${e.group_id} => ${content}`,true)
            return
        }else{
            e.reply('该功能仅限群管理或主人',true)
            return
        }
    }

    async getMotd(e) {
        alias = fs.readFileSync("./data/McMotd/SAlias.json")
        alias = eval("(" + alias + ")")
        let isJava = true
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
        let res = await (await fetch(`https://api.mcstatus.io/v2/status/java/` + content)).json()
        if(res.online == false) {
            res = await (await fetch(`https://api.mcstatus.io/v2/status/bedrock/` + content)).json()
            isJava = false
        }
        let time = ((performance.now() - startime)/1000).toFixed(2)
        if(res.online == false){
            e.reply(`所查的服务器不在线\n查询IP: ${content}`,true)
            return false
        }
        const message = []
        if(isJava){
            let serverImg = ''
            if (res.icon == null) {
                serverImg = "https://api.mcstatus.io/v2/icon"
            }else{
                serverImg = res.icon.replace(/data:image\/png;base64,/, "base64://")
            }
            message.push(segment.image(serverImg))
        }
        message.push(res.motd.clean,`\n---\n[IP] ${content}`)
        if(isJava){
            let srvRecord = '无'
            if (res.srv_record != null) {
                srvRecord = res.srv_record.host + ":" + res.srv_record.port
            }
            message.push(`\n[SRV记录] ${srvRecord}`)
        }
        if(isJava){
            message.push(`\n[版本] Java | ${res.version.name_clean}[${res.version.protocol}]`)
        }else{
            message.push(`\n[版本] Bedrock | ${res.version.name}[${res.version.protocol}]`)
        }
        message.push(`\n[请求耗时] ${time}s`)
        e.reply(message,true)
        return true
    }
}