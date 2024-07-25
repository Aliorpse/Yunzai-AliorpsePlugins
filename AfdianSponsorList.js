/**
 * 爱发电赞助者名单获取插件
 * 
 * 需要填user_id,token
 * 在 https://afdian.com/dashboard/dev 获取
 * 
 * 指令格式在下方的正则表达式中
 * #spadd(手动添加赞助者)的用法是#spadd+@群u+数字,省略加号，spadd和@之间没有空格，因为是面向主人的功能，所以没写纠错兼容
 * 
 * 你的所有爱发电订单需要群u在订单留言里填QQ号,这样才会被计入数据库
 * 你的所有爱发电订单需要群u在订单留言里填QQ号,这样才会被计入数据库
 * 
 * 考虑到用户没有公网IP，本插件采用
 * 
 * 这个插件的拓展性很强，如果你有需要对此插件进行拓展或者单独定制修改，欢迎联系QQ3521766148
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import fs from "fs"
import crypto from "crypto"

const listLine1 = `赞助列表:` //代码中写了展示总总赞助金额的变量all,如有需要可以自行改动代码使用(在这加似乎不行,因为这里未定义)
const listLine2 = "\n由衷感谢各位的赞助!"  //列表结尾

const uid = "placeholder"  //爱发电user_id
const token = "placeholder"  //爱发电token

const regList = /^#赞助(名单|列表)(.*)/
const regAdd = /^#spadd(.*)/
const regRefresh = /^#更新赞助(.*)/

if (!fs.existsSync("./data/SponsorList/users.json")) {
    fs.mkdirSync("./data/SponsorList")
    fs.writeFileSync("./data/SponsorList/users.json","{}")
}

function calculateMD5Hash(inputString) {
    const md5Hash = crypto.createHash('md5')
    md5Hash.update(inputString, 'utf-8')
    return md5Hash.digest('hex')
  }

function createSign(inputString) {
    const time = Math.floor(Date.now() / 1000)
    const params = inputString
    const md5 = calculateMD5Hash(`${token}params${params}ts${time}user_id${uid}`)
    return `user_id=${uid}&ts=${time}&params=${params}&sign=${md5}`
}

export class sponsor extends plugin {
    constructor() {
        super({
            name: 'sponsorlist',
            dsc: 'sponsor management',
            event: 'message',
            priority: 5000,
            rule: [
                {
                    reg: regList,
                    fnc: 'showList'
                },
                {
                    reg: regAdd,
                    fnc: 'sponsorAdd'
                },
                {
                    reg: regRefresh,
                    fnc: 'refresh'
                }
            ]
        })
    }

    async sponsorAdd(e){
        const list = JSON.parse(fs.readFileSync("./data/SponsorList/users.json"))
        if(!(e.isMaster)) { return true }
        list[e.message[1].qq] = [await e.message[1].text.replace('@', ''),(await (e.message[2].text).replace(/ /g,""))]
        fs.writeFileSync('./data/SponsorList/users.json',JSON.stringify(list))
        e.reply(`${e.message[1].qq} => ${e.message[2].text}`)
        return true
    }

    async showList(e){
        let list = JSON.parse(fs.readFileSync("./data/SponsorList/users.json"))
        list = Object.entries(list).sort((a, b) => parseFloat(b[1][1]) - parseFloat(a[1][1]))
        let message = [`placeholder`]
        let all = 0
        for (let key of Object.keys(list)){
            all += parseFloat(list[key][1][1])
            if(!isNaN(list[key][0])){
                message.push(`\n-${list[key][1][0]}(${list[key][0]}) | ${list[key][1][1]}元`)
            }else{
                message.push(`\n-${list[key][1][0]} | ${list[key][1][1]}元`)
            }
        }
        all = all.toFixed(2)
        message[0] = listLine1
        message.push(listLine2)
        e.reply(message)
        return true
    }

    async refresh(e){
        let list = JSON.parse(fs.readFileSync("./data/SponsorList/users.json"))
        const res = await (await fetch(`https://afdian.com/api/open/query-sponsor?${createSign('{"page":1,"per_page":100}')}`)).json()
        if(res.ec != 200) {
            return e.reply(res.em)
        }
        let res2 = await (await fetch(`https://afdian.com/api/open/query-order?${createSign('{"page":1,"per_page":100}')}`)).json()
        let list2 = {}
        for (let key of Object.keys(res2.data.list)){
            list2[res2.data.list[key].user_id] = res2.data.list[key].remark
        }
        let all = 0
        for (let key of Object.keys(res.data.list)){
            if(list2[res.data.list[key].user.user_id] != ''){
                list[list2[res.data.list[key].user.user_id]] = [res.data.list[key].user.name,res.data.list[key].all_sum_amount]
            }else{all+=1}
        }
        fs.writeFileSync('./data/SponsorList/users.json',JSON.stringify(list))
        e.reply(`更新完成,共有${all}个用户订单没有留言QQ号,已忽略`)
        return true
    }
}