/**
 * 该插件已被TRSS-Yunzai原生功能代替(yunzai/config/config/group.yml 群CD)
 * 
 * 本插件用于解决一个群内多个同后端yunzai机器人对同一条指令的重复响应问题
 */
import plugin from '../../lib/plugins/plugin.js'

const delay = 400 //如果有时无法屏蔽多个回复,适当增加这个值,单位毫秒

export class singleReply extends plugin {
    static delaySet = new Set()
    constructor() {
        super({
            name: 'singleReply',
            event: 'message',
            priority: -9999
        })
    }

    accept(e) {

        if (!e.isGroup) { return true }
        if (singleReply.delaySet.has(e.group_id)) {
            return "return"
        }

        singleReply.delaySet.add(e.group_id)
        setTimeout(() => {
            singleReply.delaySet.delete(e.group_id)
        }, delay)
        return true

    }
}
