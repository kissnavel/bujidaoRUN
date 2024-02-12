import plugin from '../../../lib/plugins/plugin.js'
import MysApi from '../model/mys/mysApi.js'
import Cfg from '../model/Cfg.js'
import fs from 'node:fs'
import _ from 'lodash'

export class ji_config extends plugin {
    constructor() {
        super({
            name: '寄·配置',
            dsc: '',
            event: 'message',
            priority: Cfg.getConfig('config').priority ?? -114514,
            rule: [
                {
                    reg: /^#(社区)?签到(添加|删除)?(白名单|推送)(群)?.*$/i,
                    permission: 'master',
                    fnc: 'setwhite'
                },
                {
                    reg: '^#?(开启|关闭)崩三签到$',
                    fnc: 'setbh3'
                },
                {
                    reg: '^#?设置社区签到(经验|米币)$',
                    fnc: 'setbbs'
                },
                {
                    reg: '^#?(原神|星铁|崩三)?(禁用|解禁)(uid)?\\s*([1-9]|18)[0-9]{8}$',
                    fnc: 'banUid'
                },
                {
                    reg: '^#?寄(替换|还原)$',
                    permission: 'master',
                    fnc: 'jicopy'
                }
            ]
        })
    }

    async setwhite(e) {
        let white = Cfg.getConfig('white')
        let id = e.msg.replace(/#(社区)?签到(添加|删除)?(白名单|推送)(群)?\s*/i, '').trim()
        if (e.msg.includes('群') || e.msg.includes('推送')) return e.reply('建议使用锅巴配置')

        let action = e.msg.includes('添加') ? '添加' : '删除'
        let set = white[e.msg.includes('群') ? 'Group' : e.msg.includes('社区') ? 'bbsQQ' : 'QQ']
        let name = e.msg.includes('群') ? '群' : 'QQ'
        let push = e.msg.includes('推送') ? '推送' : '白'

        if (!id) id = e.user_id

        id = Number(id) || String(id)

        if (action === '添加') {
            if (set && set.includes(id))
                return e.reply(`${name}:${id}已在${push}名单中`)
            set.push(id)
            Cfg.setConfig('white', white)
            return e.reply(`已${action}${push}名单${name}:${id}`)
        } else if (action === '删除') {
            if (set.length === 0)
                return e.reply(`未添加${push}名单${name}`)

            let index = set.findIndex(q => q == id)
            if (index !== -1) {
                set.splice(index, 1)
                Cfg.setConfig('white', white)
                e.reply(`已${action}${push}名单${name}:${id}`)
            } else {
                e.reply(`${name}:${id}未在${push}名单中`)
            }
            return
        } else {
            let msg = set.slice()
            msg = msg.map((e, i) => `${i + 1}. ${e}`).join(', ')
            return e.reply(msg, false)
        }
    }

    async setbh3(e) {
        let id = Number(e.user_id) || String(e.user_id)
        let config = Cfg.getConfig('config')
        let white = Cfg.getConfig('white')
        if (!config.game?.includes('bh3'))
            return e.reply('主人未启用崩坏三签到')

        let { cks, uids } = await Cfg.getcks(false, e.user_id)

        if (_.every(cks, _.isEmpty))
            return e.reply('\n请【#扫码登录】或【#刷新ck】后再开启', false, { at: true })

        let msgs = []; let cknum = 0

        for (let i = 0; i < uids.bh3.length; i++) {
            let uid = uids.bh3[i]; let ck = cks.bh3[uid]
            let mysApi = new MysApi(ck.uid, ck.ck, { log: false }, 'bh3', ck.region)
            let signInfo = await mysApi.getData('sign_info')
            if ((signInfo?.retcode == -100 && signInfo?.message == '尚未登录') || signInfo?.message.includes('请登录后重试')) {
                msgs.push(`\n崩三uid:${ck.uid}，ck失效`)
                cknum++
            }
            await common.sleep(500)
        }
        msgs.push('\n请【#扫码登录】或【#刷新ck】')
        if (cknum > 0) return e.reply(msgs, false, { at: true })

        let action = e.msg.includes('开启') ? '开启' : '关闭'
        let set = white.bh3QQ

        if (action === '开启') {
            if (set?.includes(id))
                return e.reply(`\n你已开启过崩坏三签到${white['QQ']?.includes(id) ? '' : '\n如需自动签到请【#开启自动签到】'}`, false, { at: true })

            set.push(id)
            Cfg.setConfig('white', white)
            return e.reply(`\n已开启崩坏三签到${white['QQ']?.includes(id) ? '' : '\n如需自动签到请【#开启自动签到】'}`, false, { at: true })
        } else if (action === '关闭') {
            if (set.length === 0)
                return e.reply(`还没有人开启崩坏三签到哦...`)

            let index = set.findIndex(q => q == id)
            if (index !== -1) {
                set.splice(index, 1)
                Cfg.setConfig('white', white)
                e.reply(`已关闭崩坏三签到...`, false, { at: true })
            } else {
                e.reply(`你还没有开启崩坏三签到哦...`, false, { at: true })
            }
            return
        }
    }

    async setbbs(e) {
        let white = Cfg.getConfig('white')
        let id = Number(e.user_id) || String(e.user_id)

        if (e.msg.includes('经验')) {
            if (white.exQQ?.includes(id))
                return e.reply(`\n当前社区签到模式：【米币+经验】`, false, { at: true })

            white.exQQ.push(id)
            Cfg.setConfig('white', white)
            return e.reply(`\n社区签到模式已设置：【米币+经验】`, false, { at: true })
        } else if (e.msg.includes('米币')) {
            if (white.exQQ.length === 0)
                return e.reply(`\n当前社区签到模式：【米币】`, false, { at: true })

            let index = white.exQQ.findIndex(q => q == id)
            if (index !== -1) {
                white.exQQ.splice(index, 1)
                Cfg.setConfig('white', white)
                e.reply(`\n社区签到模式已设置：【米币】`, false, { at: true })
            } else {
                e.reply(`\n当前社区签到模式：【米币】`, false, { at: true })
            }
            return
        }
    }

    async banUid(e) {
        let uid = Number(e.msg.replace(/#?(原神|星铁|崩三)?(禁用|解禁)(uid)?\s*/i, '').trim())

        if (!uid) return e.reply('未输入UID')

        let Uid = Cfg.getConfig('banuid')

        let name = e.msg.includes('星铁') ? '星铁' : e.msg.includes('崩三') ? '崩三' : '原神'
        let set = Uid[e.msg.includes('星铁') ? 'sr' : e.msg.includes('崩三') ? 'bh3' : 'gs']
        let action = e.msg.includes('禁用') ? '禁用' : '解禁'
        let g = e.msg.includes('星铁') ? 'sr' : e.msg.includes('崩三') ? 'bh3' : 'gs'

        if (!e.isMaster) {
            let { cks } = await Cfg.getcks(false, e.user_id)
            if (_.isEmpty(cks[g]))
                return e.reply('未绑定ck,或此UID已禁用', false, { at: true })
            if (!cks[g][uid])
                return e.reply(`只能${action}自己已绑ck的uid\n或此UID已禁用`)
        }

        if (action === '禁用') {
            if (set && set.includes(uid))
                return e.reply(`${name}UID:${uid}已禁用`)

            set.push(uid)
            Cfg.setConfig('banuid', Uid)
            return e.reply(`已${action}${name}UID:${uid}`)
        } else {
            if (set.length === 0)
                return e.reply(`未添加禁用UID`)

            let index = set.findIndex(q => q == uid)
            if (index !== -1) {
                set.splice(index, 1)
                Cfg.setConfig('banuid', Uid)
                e.reply(`已${action}${name}UID:${uid}`)
            } else {
                e.reply(`${name}UID:${uid}未禁用`)
            }
            return
        }
    }

    async jicopy(e) {
        let info = './plugins/genshin/model/mys/mysInfo.js'
        if (!fs.existsSync(`${Cfg.resfile}temp`))
            fs.mkdirSync(`${Cfg.resfile}temp`)

        if (e.msg.includes('替换')) {
            if (fs.existsSync(`${Cfg.resfile}temp/mysInfo.js`))
                return e.reply('已有未还原备份，若无更新冲突无需替换\n否则请【#寄还原】后更新本体再替换')
            fs.copyFileSync(info, `${Cfg.resfile}temp/mysInfo.js`)
            fs.copyFileSync(`${Cfg.defile}/mysInfo.js`, info)
            return e.reply('替换成功，重启后生效')
        } else {
            if (!fs.existsSync(`${Cfg.resfile}temp/mysInfo.js`))
                return e.reply('你还没有替换过，无法还原哦')
            fs.copyFileSync(`${Cfg.resfile}temp/mysInfo.js`, info)
            fs.unlinkSync(`${Cfg.resfile}temp/mysInfo.js`)
            return e.reply('还原成功')
        }
    }
}