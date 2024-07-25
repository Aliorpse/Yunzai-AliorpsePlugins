/**
 * 轻量，快速的b站视频解析插件
 * 通过匹配BV号,av号,b23.tv短链获取视频数据
 * 返回360p原视频和视频相关信息
 * 
 * 这个插件要求你的ffmpeg所在的文件夹在PATH环境变量中
 */

import plugin from '../../lib/plugins/plugin.js'
import _ from 'lodash'

const regB23 = /b23\.tv\/\w{7}/
const regBV = /BV1\w{9}/
const regAV = /av\d+/

function formatNumber(num) {
    if(num < 10000){
        return num
    }else{
        return (num/10000).toFixed(1) + "万"
    }
}

export class bilitv extends plugin {
    constructor(){
        super({
            name: "bilitv",
            dsc: "b站视频解析",
            event: "message",
            priority: 5000,
            rule:[
                {
                    reg: regBV,
                    fnc: "jiexi"
                },
                {
                    reg: regB23,
                    fnc: "jiexi"
                },
                {
                    reg: regAV,
                    fnc: "jiexi"
                }
            ]
        })
    }

    async jiexi(e){
        let bvid = ""
        if(e.msg.match(regAV)){
            let table = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'
            let tr = {}
            for (let i = 0; i < 58; i++) { tr[table[i]] = i }
            const s = [11, 10, 3, 8, 4, 6]
            const xor = 177451812
            const add = 8728348608
            let x = (regAV.exec(e.msg))[0].replace(/av/g,"")
            x = (x ^ xor) + add
            const r = Array.from('BV1  4 1 7  ')
            for (let i = 0; i < 6; i++) {
                r[s[i]] = table[Math.floor(x / 58 ** i) % 58]
            }
            bvid = r.join("")
            if(!(bvid.match(regBV))){
                return true
            }
        }
        if(e.msg.includes("点赞" && "投币")){ return true }
        if(e.msg.match(regB23)){
            try{
                bvid = regBV.exec((await fetch("https://"+regB23.exec(e.msg))).url)
                if(bvid == null){
                    e.reply("解析失败",true)
                    return true
                }
            }catch(e){
                e.reply("解析失败",true)
                return true
            }
        }else{
            if(bvid == ""){
                bvid = regBV.exec(e.msg)
            }
        }
        let res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,{
            headers: {
                'referer': 'https://www.bilibili.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
            }
        })
        res = await res.json()
        if(res.code != 0){
            e.reply("解析失败\n信息:" + res.message)
        }else{
            e.reply([
                segment.image(res.data.pic),`${res.data.title}\nhttps://www.bilibili.com/video/${bvid}\n作者: ${res.data.owner.name}\n播放: ${formatNumber(res.data.stat.view)} | 弹幕: ${formatNumber(res.data.stat.danmaku)}\n点赞: ${formatNumber(res.data.stat.like)} | 投币: ${formatNumber(res.data.stat.coin)}\n收藏: ${formatNumber(res.data.stat.favorite)} | 评论: ${formatNumber(res.data.stat.reply)}`
            ],true)
        }
        res = await fetch(`https://api.bilibili.com/x/player/playurl?avid=${res.data.aid}&cid=${res.data.cid}&qn=16&type=mp4&platform=html5`,{
            headers: {
                'referer': 'https://www.bilibili.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
            }
        })
        res = await res.json()
        if(!res || res.code != 0){
            e.reply("视频解析失败")
            return true
        }
        e.reply(segment.video(Buffer.from(await (await fetch(res.data.durl[0].url,{
            headers: {
                'referer': 'https://www.bilibili.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
            }
        })).arrayBuffer())))
        return true
    }
}