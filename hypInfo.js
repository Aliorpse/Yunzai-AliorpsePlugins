/**
Hypixel查询插件
用法:#hyp [playername]
用户数据缓存:Yunzai-Bot/data/hypInfo/PlayerData
*/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import * as fs from 'fs'
import fetch from 'node-fetch'
const _path = process.cwd()

let API_KEY="xxxx-xxxx-xxxx-xxxx"; //替换API_KEY为你的Hypixel ApiKey 获取方法: 登陆Hypixel服务器，输入/api回车，返回字段即为你的API. 点击字段将其放在你的输入框，然后Ctrl+A，Ctrl+C获取

export class hypInfo extends plugin {
  constructor () {
    super({
      name: 'HypInfo',
      dsc: '获取Hypixel玩家信息',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '#hyp',
          fnc: 'getInfo'
        }
      ]
    })
  }

  async getInfo (e) {
    let lang = ""
    let recentg = ""
    let exp = ""
    let channel = ""
    let arch = ""
    let firstli = ""
    let lastli = ""
    let lastlo = ""
    let guildname = ""
    const player = e.message[0].text.slice(5)
    if(player == ""){
        e.reply(`指令用法:\n    #hyp [玩家名]`,true)
        return
    }
    let res = await getProfile(API_KEY,player)
    let resfrom = "数据类型: 即时数据"
    if(res.success == false){
        if(res.cause == "You have already looked up this name recently"){
          res = fs.readFileSync(`${_path}/data/hypInfo/PlayerData/${player}.json`)
          resfrom = "数据类型: 缓存数据"
          res = JSON.parse(res)
        }else{
          e.reply(`错误: ${res.cause}`,true)
          return
        }
    }else if(res.player == null){
      e.reply("错误: 未找到该玩家",true)
      return
    }
    if(fs.existsSync(`${_path}/data/hypInfo/PlayerData/`) == false){
      fs.mkdirSync(`${_path}/data/hypInfo/PlayerData/`,{ recursive: true })
    }
    fs.writeFileSync(`${_path}/data/hypInfo/PlayerData/${player}.json`,JSON.stringify(res))
    let rank = await getRank(JSON.stringify(res))
    if (res.player.hasOwnProperty("networkExp")){
      exp = (Math.sqrt(0.0008 * res.player.networkExp + 12.25) - 3.5 + 1).toFixed(3)
    }else{
      exp = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("userLanguage")){
      lang = res.player.userLanguage
    }else{
      lang = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("mostRecentGameType")){
      recentg = res.player.mostRecentGameType
    }else{
      recentg = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("channel")){
      channel = res.player.channel
    }else{
      channel = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("achievementPoints")){
      arch = res.player.achievementPoints
    }else{
      arch = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("firstLogin")){
      firstli = await getTime(res.player.firstLogin)
    }else{
      firstli = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("lastLogout")){
      lastlo = await getTime(res.player.lastLogout)
    }else{
      lastlo = "玩家阻止获取"
    }
    if(res.player.hasOwnProperty("lastLogin")){
      lastli = await getTime(res.player.lastLogin)
    }else{
      lastli = "玩家阻止获取"
    }
    let status = await getStatus(API_KEY,res.player.uuid)
    let guildres = await fetch(`https://api.hypixel.net/guild?key=${API_KEY}&player=${res.player.uuid}`)
    guildres = await guildres.json()
    if(guildres.guild != null){
      guildname = guildres.guild.name
    }else{
      guildname = "无"
    }
    e.reply(
      `${rank}${res.player.displayname}的Hypixel信息:\n`+
      `UUID: ${res.player.uuid}\n`+
      `等级: ${exp} | 人品: ${res.player.karma}\n`+
      `成就: ${arch} | 频道: ${channel}\n`+
      `语言: ${lang} | 最近游玩: ${recentg}\n`+
      `状态: ${status} | 公会: ${guildname}\n`+
      `首次登入: ${firstli}\n`+
      `最后登入: ${lastli}\n`+
      `最后登出: ${lastlo}\n`+
      `${resfrom}\n`
    ,true)
    }
};

async function getProfile(key,name){
    let res = await fetch(`https://api.hypixel.net/player?key=${key}&name=${name}`)
    res = await res.json()
    return res
}

async function getStatus(key,uuid){
  let res = await fetch(`https://api.hypixel.net/status?key=${key}&uuid=${uuid}`)
  let status = ""
  res = await res.json()
  if(res.session.online == "true"){
    status = "在线"
  }else{
    status = "离线"
  }
  return status
}

async function getRank(res){
  let rank = ""
  res = JSON.parse(res)
  if(res.player.hasOwnProperty("rank")){
    rank = "["+res.player.rank+"] "
  }else if(res.player.hasOwnProperty("packageRank")){
    rank = "["+res.player.packageRank+"] "
  }else if(res.player.hasOwnProperty("newPackageRank")){
    rank = "["+res.player.newPackageRank+"] "
  }else{
    rank = ""
  }
  if(rank.includes("PLUS")){
    rank = rank.replace(/PLUS/g, "+").replace(/_/, "")
  }
  return rank
}

async function getTime(UnixTime){
    let date = (new Date(UnixTime)).toLocaleString()
    return date
}