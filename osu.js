/**
 * osu玩家信息查询，仍在制作中
 * 请使用pnpm add osu-web.js添加依赖
 * 
 * !ob [id] 绑定个人信息，如"!ob 35996527"
 * !ou (name)? 查询个人信息,接用户名称,不接默认查自己
 * !ap [value] pp模拟计算器,返回加上一个pp的值后绑定账户的rank与加权pp值
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import { Client } from 'osu-web.js'
import fs from "fs"
//下面两项在https://osu.ppy.sh/home/account/edit 的"开放授权"处获取(不用填写回调链接)
const id = "client id"
const secret = "client secret"

if (!fs.existsSync("./data/osuc/token.txt")) {
  fs.mkdirSync("./data/osuc")
  fs.writeFileSync("./data/osuc/token.txt","")
}

if (!fs.existsSync("./data/osuc/users.json")) {
  fs.writeFileSync("./data/osuc/users.json","{}")
}

const regUser = /^(\!|！)ou(.*)/
const regBind = /^(\!|！)ob(.*)/
const regPPTest = /^(\!|！)ap(.*)/

async function getFormattedTime(sec) {
  const hours = Math.floor(sec / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  let durationText = ''
  if (hours >= 1) {
      durationText += `${hours}h`
  }
  if (minutes >= 1) {
      durationText += `${minutes}m`
  }
  return durationText
}

async function getToken(){
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
  }
  const body = `client_id=${id}&client_secret=${secret}&grant_type=client_credentials&scope=public`
  let token = await fetch("https://osu.ppy.sh/oauth/token",{
    method: "POST",
    headers,
    body: body,
  })
  token = await token.json()
  fs.writeFileSync("./data/osuc/token.txt",token.access_token)
  return token.access_token
}

async function fetchUser(c,e) {
  let client = new Client(fs.readFileSync("./data/osuc/token.txt"))
  try {
      return await client.users.getUser(c, {
          urlParams: {
              mode: 'osu'
          }
      })
  } catch (err) {
      console.log(err)
      if (err.response1.status == 404) { return e.reply("查无此人") }
      if (err.response1.status != 401) { return e.reply("未知错误: " + err.response1.status) }
      e.reply("token貌似过期,重新获取...")
      client.setAccessToken(await getToken())
      return await client.users.getUser(c, {
          urlParams: {
              mode: 'osu'
          }
      })
  }
}

export class osu extends plugin {
    constructor () {
      super({
        name: 'osu',
        dsc: 'none',
        event: 'message',
        priority: -1,
        rule: [
          {
            reg: regUser,
            fnc: 'getUser'
          },
          {
            reg: regBind,
            fnc: 'bindUser'
          },
          {
            reg: regPPTest,
            fnc: 'PPpTest'
          }
        ]
      })
    }

    async bindUser(e){
      const users = JSON.parse(fs.readFileSync("./data/osuc/users.json"))
      let c = await (await e.msg.replace(/^(\!|！)ob/,"")).replace(/ /g,"")
      if(c == ""){ return true }
      users[e.sender?.user_id] = c
      fs.writeFileSync("./data/osuc/users.json",JSON.stringify(users))
      e.reply(`${e.sender?.user_id} => ${c}`,true)
      return true
    }

    async getUser(e){
      const users = JSON.parse(fs.readFileSync("./data/osuc/users.json"))
      let c = await (await e.msg.replace(/^(\!|！)ou/, "")).replace(/ /g, "")
      if (c == "") {
          c = users[e.sender?.user_id]
      } else {
          c = `@` + c
      }

      c = await fetchUser(c,e)

      let message = [`[${c.country_code}]${c.username}`]
      logger.info(c)
      if (c.is_supporter) { message[0] += "[❤]" }
      c = c.statistics
      logger.info(JSON.stringify(c))
      message[0] += ` - Lv.${c.level.current}\n`
      message.push(`全球#${c.global_rank} 地区#${c.country_rank}\n---\n`)
      message.push(`表现分: ${c.pp.toFixed(2)}pp | 准度: ${c.hit_accuracy.toFixed(2)}%\n`)
      message.push(`最大连击: ${c.maximum_combo} | 命中次数: ${(c.total_hits / 1000).toFixed(2)}k\n`)
      message.push(`总分(R/T): ${(c.ranked_score / 1000000).toFixed(2)}M / ${(c.total_score / 1000000).toFixed(2)}M\n`)
      message.push(`游玩次数: ${c.play_count} | 游玩时间: ${await getFormattedTime(c.play_time)}\n`)
      e.reply(message)
      return true
    }

    async PPpTest(e){
      const users = JSON.parse(fs.readFileSync("./data/osuc/users.json"))
      let client = new Client(fs.readFileSync("./data/osuc/token.txt"))
      let pp = await (await e.msg.replace(/^(\!|！)ap/, "")).replace(/ /g, "")
      if (pp == "") { return e.reply("参数不足") }
      let c = users[e.sender?.user_id]
      if (c == undefined) { return e.reply("你未绑定") }
      
      try {
          c = await client.users.getUserScores(c, 'best', {
              query: {
                  mode: 'osu',
                  limit: 114514
              }
          })
      } catch (err) {
          console.log(err)
          if (err.response1.status == 404) { return e.reply("查无此人") }
          if (err.response1.status != 401) { return e.reply("未知错误: " + err.response1.status) }
          e.reply("token貌似过期,重新获取...")
          client.setAccessToken(await getToken())
          c = await client.users.getUserScores(c, 'best', {
              query: {
                  mode: 'osu',
                  limit: 114514
              }
          })
      }
      
      const c2 = await fetchUser(users[e.sender?.user_id],e)
      
      let totalpp = 0
      let totalorg = 0
      let pos = 0
      let stat = false
      
      for (let key of Object.keys(c)) {
          totalorg += c[key].weight.pp
      }
      
      for (let key of Object.keys(c)) {
          if (!stat && pp >= c[key].pp) {
              c.splice(key, 0, { pp: parseFloat(pp) })
              pos = key
              stat = true
          } else {
              c[key] = { pp: c[key].pp }
          }
      }
      
      const prisepp = c2.statistics.pp - totalorg
      
      for (let key of Object.keys(c)) {
          totalpp += parseFloat(c[key].pp) * Math.pow(0.95, parseInt(key))
      }
      
      let rankNow = parseInt(await (await fetch(`https://osudaily.net/data/getPPRank.php?t=pp&v=${totalpp + prisepp}&m=0`)).text())
      let rankPre = parseInt(await (await fetch(`https://osudaily.net/data/getPPRank.php?t=pp&v=${totalorg + prisepp}&m=0`)).text())
      
      e.reply((pp * Math.pow(0.95, pos)).toFixed(2) + `pp 个人#` + (parseInt(pos) + 1) + ` (` + (Math.pow(0.95, pos)).toFixed(2) + `)\n\n总PP: ` + (totalpp + prisepp).toFixed(2) + ` (` + c2.statistics.pp.toFixed(2) + `+` + (totalpp + prisepp - c2.statistics.pp).toFixed(2) + `)\n全球#` + rankNow + ` (#${rankPre}+${rankPre - rankNow})`)
      return true
    }
}