/**
 * 根据AfdianSponsorList.js的用户列表自动同意群申请，不在则拒绝
 */

import _ from 'lodash'
import plugin from '../../lib/plugins/plugin.js'
import fs from "fs"

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
        const list = JSON.parse(fs.readFileSync("./data/SponsorList/users.json"))
        if(list.hasOwnProperty(e.user_id) || e.isMaster){
            e.approve(true)
        }else{
            e.approve(false)
        }
        return true
    }
}