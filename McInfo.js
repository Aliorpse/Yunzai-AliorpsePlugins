import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'
const _path = process.cwd();

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
    if (content == "") return
    let res = await fetch("https://api.mojang.com/users/profiles/minecraft/"+content)
    if (!res) { return false }
    res = await res.json()
    if(res.hasOwnProperty("errorMessage") === true){
      if(res.errorMessage == "Couldn't find any profile with that name"){
        e.reply("无法找到该玩家，请检查输入信息",true)
      }else{
        e.reply(res.errorMessage,true)
      }
    }else{
      let res2 = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/"+res.id)
      res2 = await res2.json()
      let res3 = Buffer.from(res2.properties[0].value, 'base64');
      res3 = JSON.parse(res3)
      let skin = res3.textures.SKIN
      let cape = res3.textures.CAPE
      if(res3.textures.hasOwnProperty("CAPE") === true){
        const message = [
          `MC正版玩家查询\n----`,
          `\n[Player] ${res.name}`,
          `\n[UUID] ${res.id}`,
          `\n[皮肤]`,
          segment.image(skin.url),
          `\n[披风]`,
          segment.image(cape.url),
        ]
        e.reply(message,true)
      }else{
        const message = [
          `MC正版玩家查询\n----`,
          `\n[Player] ${res.name}`,
          `\n[UUID] ${res.id}`,
          `\n[皮肤]`,
          segment.image(skin.url),
        ]
        e.reply(message,true)
      }
    }
  }
}