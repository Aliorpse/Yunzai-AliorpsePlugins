/**
 * 本插件用于解决一个群内多个同后端yunzai机器人对同一条指令的重复响应问题
 * 截止目前，这个插件依赖报错工作，所以报错是正常的，如果有不报错解决问题的办法欢迎PR!
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
            return this.skip() //这里阻断消息继续处理,会导致报错,自己测试return false无法阻断(this.skip()无任何意义)
        }

        singleReply.delaySet.add(e.group_id)
        setTimeout(() => {
            singleReply.delaySet.delete(e.group_id)
        }, delay)
        return true

    }
}
