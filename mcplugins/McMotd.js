/**
 * 我的世界 多功能服务器状态查询 支持基岩,Java,可以添加群聊默认服务器
 * #motd [Address]
 * #mcsadd [Address]
 * 默认需要安装一个额外字体，在开源仓库下的fonts文件夹
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import fetch from 'node-fetch'
import fs from "fs"
import puppeteer from "puppeteer";

const regexMotd = /^#motd(.*)/
const regexAdd = /^#mcsadd(.*)/

if (!fs.existsSync("./data/McMotd/SAlias.json")) {
    fs.mkdirSync("./data/McMotd")
    fs.writeFileSync("./data/McMotd/SAlias.json","{}")
}

let alias = ""

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
        e.reply(`正在查询[${content}],请稍后`,false,{ recallMsg: 10 })
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
        let serverVersion;
        if(isJava){
            serverVersion = `Java - ${res.version.name_clean}[${res.version.protocol}]`
        }else{
            serverVersion = `Bedrock - ${res.version.name}[${res.version.protocol}]`
        }
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .body {
            width: 1000px;
            height: 160px;
            border-radius: 20px;
        }
        .box {
            display: flex;
            align-items: center;
            width: 1000px;
            height: 160px;
            background-image: url("favicon.jpg");
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center center;
            border-radius: 10px;
        }
        .icon {
            margin-left: 16px;
            border-radius: 20px;
        }
        .text {
            font-family: "阿里巴巴普惠体",sans-serif;
            flex-grow: 1;
            color: white;
            font-size: 26px;
            padding-left: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 1);
            white-space: pre;
        }
    </style>
</head>
<body class="body">
    <div class="box">
        <img class="icon" src="favicon.jpg" alt="icon" width="128" height="128">
        <p class="text">${(res.motd.html).replace("\n","<br>").replace(/\n/g,"")}
IP: <span style="text-decoration: underline;">${content}</span> | 请求耗时: ${time}s
在线: ${res.players.online}/${res.players.max} | ${serverVersion}</p>
    </div>
</body>
</html>
`       
        if(isJava){
            if (res.icon == null) {
                html = html.replace(/favicon.jpg/g,"https://api.mcstatus.io/v2/icon")
            }else{
                html = html.replace(/favicon.jpg/g, res.icon)
            }
        }else{
            html = html.replace("margin-left: 16px;","margin-left: 16px;display: none;")
        }
        fs.writeFileSync("./data/McMotd/temp.html",html)
        const browser = await puppeteer.launch({args: ['--no-sandbox','--disable-setuid-sandbox'] })
        const page = await browser.newPage()
        await page.goto("file:///" + process.cwd() + "/data/McMotd/temp.html")
        const boundingBox = await (await page.$('body')).boundingBox();
        await page.setViewport({
            width: Math.ceil(boundingBox.width+15),
            height: Math.ceil(boundingBox.height+15)
        })
        const image = Buffer.from(await page.screenshot())
        e.reply(segment.image(image),true)
        return true
    }
}