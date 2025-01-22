/**
 * 本插件用于解决一个群内多个同后端yunzai机器人对同一条指令的重复响应问题
 * 截止目前，这个插件依赖报错工作，所以报错是正常的，关键在于return this.skip()这一行,如果有不报错解决问题的办法欢迎PR!
 * (已经试过return false不能阻拦消息继续处理)
 */
import plugin from '../../lib/plugins/plugin.js'

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
            return this.skip()
        }

        singleReply.delaySet.add(e.group_id)
        setTimeout(() => {
            singleReply.delaySet.delete(e.group_id)
        }, 300)
        return true
    }
}
