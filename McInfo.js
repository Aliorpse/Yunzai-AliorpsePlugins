/**
插件作者3521766148
开源地址https://gitee.com/Aliorpse/Yunzai-McMotd/

使用教程:
#mcinfo [Name] / 获取Java正版玩家信息
*/
import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
import { segment } from "oicq"
import fetch from 'node-fetch'

export class McInfo extends plugin {
  constructor () {
    super({
      name: 'McInfo',
      dsc: '获取mc正版玩家信息',
      event: 'message',
      priority: 5000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '#mcinfo',
          /** 执行方法 */
          fnc: 'getInfo'
        }
      ]
    })
  }

  async getInfo (e) {
    const content = e.message[0].text.slice(8)
    if (content == "") {
      e.reply(
        `用法:#mcinfo [PlayerName]`
      ,true)
      return
    }
    let res = await fetch("https://playerdb.co/api/player/minecraft/"+content, {
      headers:{
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
    }
    })
    if (!res) { return false }
    res = await res.json()
    if(res.code == "player.found"){
      let skin = await fetch(`http://minecraft-api.com/api/skins/${res.data.player.username}/body/10.5/10/10/25/3`)
      skin = await skin.text();
      skin = skin.replace(/<img src="data:image\/png\;base64, /,"").replace(/" alt="Minecraft-API.com skin player" \/>/, "")
      const message = [
        `MC正版玩家查询\n----`,
        `\n[玩家] ${res.data.player.username}`,
        `\n[UUID] ${res.data.player.id}`,
        `\n[皮肤]`,
        segment.image(`base64://${skin}`),
      ]
      e.reply(message,true)
    }else{
      if(res.message == "Mojang API lookup failed.") e.reply("错误: 未找到该玩家",true)
      else e.reply("错误: "+ res.message,true)
    }
  }
}