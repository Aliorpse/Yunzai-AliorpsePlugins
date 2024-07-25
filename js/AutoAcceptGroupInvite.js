/**
 * 自动同意群申请，没别的了
 * 与yunzai功能搭配使用
 */

import _ from 'lodash'
import plugin from '../../lib/plugins/plugin.js'

export class AutoAccept extends plugin {
    constructor() {
        super({
            name: 'AutoAccept',
            dsc: '自动同意群申请',
            event: 'request.group.invite',
            priority: -1,
        })
    }

    async accept(e){
        e.approve(true)
        return true
    }
}
