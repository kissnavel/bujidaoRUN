// 原神、星铁米游社面板代码来源：https://github.com/thisee/xiaokeli，已修改适配本仓库
// 2024-10-18 目前只写了原神和星铁的4星5星圣遗物(遗器)识别
import plugin from '../../../lib/plugins/plugin.js'
import ProfileList from '../model/ProfileList.js'
import Myspanel from '../model/myspanel.js'
import MysInfo from '../model/mys/mysInfo.js'
import Cfg from '../model/Cfg.js'
import moment from 'moment'

export class ji_myspanel extends plugin {
    constructor() {
        super({
            name: '寄·米游社更新面板',
            dsc: '',
            event: 'message',
            priority: Cfg.getConfig('config').priority,
            rule: [{
                reg: '^#?(原神|星铁)?(寄|米游社|mys)?(全部面板更新|更新全部面板|获取游戏角色详情|更新面板|面板更新)$',
                fnc: 'mys'
            }]
        });
    }

    async mys(e) {
        let panel = Cfg.getConfig('config').myspanel
        if (!panel) return false
        let User = await MysInfo.get(e, 'UserGame', {}, {}, true)
        if (User?.retcode !== 0) return false
        let CD = Cfg.getConfig('config').myspanelCD
        let uid = await MysInfo.getUid(e, false)
        if (!uid) return e.reply('找不到uid，请：#刷新ck 或者：#扫码登录', true)

        let now
        if (CD > 0) {
            now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            let time_ = await redis.get(`bujidao:myspanelCD:${e.user_id}:${uid}`);
            if (time_) {
                let seconds = moment(now).diff(moment(time_), 'seconds')
                return e.reply(`UID：${uid}\n米游社更新面板cd中\n还需等待：${CD - seconds}秒`, true)
            }
        }

        await e.reply(`开始查询uid:${uid}的米游社面板数据，可能会需要一定时间~`, true)
        let device_fp = await MysInfo.get(e, 'getFp', {}, {}, true)
        if (device_fp?.retcode !== 0) return false
        let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }
        let res, data
        if (e.game == 'sr') {
            data = await MysInfo.get(e, 'avatarInfo', { headers }, {}, true)
            if (!data.data) {
                logger.mark('米游社查询失败')
                return false
            }
            await Myspanel.sr_mys(data, uid)
        } else {
            res = await MysInfo.get(e, 'character', { headers }, {}, true)
            if (!res.data) {
                logger.mark('米游社查询失败')
                return false
            }
            let ids = []
            res.data.list.map((value) => {
                ids.push(value.id)
            })
            data = await MysInfo.get(e, 'character_detail', { headers, ids: ids }, {}, true)
            if (!data.data) {
                logger.mark('米游社查询失败')
                return false
            }
            await Myspanel.gs_mys(data, uid)
        }
        //加载面板列表图
        await ProfileList.reload(e)
        if (CD > 0) {
            now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            await redis.set(`bujidao:myspanelCD:${e.user_id}:${uid}`, now, {
                EX: CD
            })
        }
    }
}
