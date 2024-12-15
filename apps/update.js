import plugin from '../../../lib/plugins/plugin.js'
import common from '../../../lib/common/common.js'
import Cfg from '../model/Cfg.js'
import { Restart } from '../../other/restart.js'
import { createRequire } from 'module'
import lodash from 'lodash'

const require = createRequire(import.meta.url)
const { exec, execSync } = require('child_process')

let uping = false

export class update extends plugin {
    constructor() {
        super({
            name: '[寄] 插件更新',
            dsc: '[寄] 插件更新',
            event: 'message',
            priority: Cfg.getConfig('config').priority,
            rule: [
                {
                    reg: '^#寄(插件)?(强制)?更新$',
                    permission: 'master',
                    fnc: 'update'
                },
                {
                    reg: '^#寄(插件)?更新日志$',
                    fnc: 'updateLog'
                }
            ]
        })
        this.typeName = 'bujidao'
    }

    async update() {
        if (!this.e.isMaster) return false
        if (uping) {
            await this.reply('已有命令更新中..请勿重复操作')
            return
        }
        /** 获取插件 */
        let plugin = 'bujidao'

        /** 检查git安装 */
        if (!await this.checkGit()) return

        /** 执行更新 */
        await this.runUpdate(plugin)

        /** 是否需要重启 */
        if (this.isUp) {
            // await this.reply('即将执行重启，以应用更新')
            setTimeout(() => this.restart(), 2000)
        }
    }

    restart() {
        new Restart(this.e).restart()
    }

    async checkGit() {
        let ret = await execSync('git --version', { encoding: 'utf-8' })
        if (!ret || !ret.includes('git version')) {
            await this.reply('请先安装git')
            return false
        }

        return true
    }

    async runUpdate(plugin = '') {
        this.isNowUp = false

        let cm = `cd "plugins/${plugin}" && git pull --no-rebase`

        let type = '更新'
        if (this.e.msg.includes('强制')) {
            this.isUp = true
            type = '强制更新'
            cm = `cd "plugins/${plugin}" && git reset --hard && git pull --rebase --allow-unrelated-histories`
        }

        this.oldCommitId = await this.getcommitId(plugin)

        await this.reply(`开始执行${type}操作...`)
        uping = true
        let ret = await this.execSync(cm)
        uping = false

        if (ret.error) {
            logger.mark(`${this.e.logFnc} 更新失败：${this.typeName}`)
            this.gitErr(ret.error, ret.stdout)
            return false
        }

        let time = await this.getTime(plugin)

        if (/Already up|已经是最新/g.test(ret.stdout)) {
            await this.reply(`${this.typeName}已经是最新\n最后更新时间：${time}`)
        } else {
            await this.reply(`${this.typeName}更新成功\n更新时间：${time}`)
            this.isUp = true
            let log = await this.getLog(plugin)
            await this.reply(log)
        }

        logger.mark(`${this.e.logFnc} 最后更新时间：${time}`)

        return true
    }

    async gitErr(err, stdout) {
        let msg = '更新失败！'
        let errMsg = err.toString()
        stdout = stdout.toString()

        if (errMsg.includes('Timed out')) {
            let remote = errMsg.match(/'(.+?)'/g)[0].replace(/'/g, '')
            await this.reply(msg + `\n连接超时：${remote}`)
            return
        }

        if (/Failed to connect|unable to access/g.test(errMsg)) {
            let remote = errMsg.match(/'(.+?)'/g)[0].replace(/'/g, '')
            await this.reply(msg + `\n连接失败：${remote}`)
            return
        }

        if (errMsg.includes('be overwritten by merge')) {
            await this.reply(msg + `存在冲突：\n${errMsg}\n` + '请解决冲突后再更新，或者执行#寄强制更新，放弃本地修改')
            return
        }

        if (stdout.includes('CONFLICT')) {
            await this.reply([msg + '存在冲突\n', errMsg, stdout, '\n请解决冲突后再更新，或者执行#寄强制更新，放弃本地修改'])
            return
        }

        await this.reply([errMsg, stdout])
    }

    async getcommitId(plugin = '') {
        let cm = `cd "plugins/${plugin}" && git rev-parse --short HEAD`

        let commitId = await execSync(cm, { encoding: 'utf-8' })
        commitId = lodash.trim(commitId)

        return commitId
    }

    async getTime(plugin = '') {
        let cm = `cd "plugins/${plugin}" && git log -1 --pretty=format:"%cd" --date=format:"%F %T"`

        let time = ''
        try {
            time = await execSync(cm, { encoding: 'utf-8' })
            time = lodash.trim(time)
        } catch (error) {
            logger.error(error.toString())
            time = '获取时间失败'
        }

        return time
    }

    async execSync(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr })
            })
        })
    }


    async getLog(plugin = '') {
        let cm = `cd "plugins/${plugin}" && git log -20 --pretty=format:"%h||[%cd] %s" --date=format:"%F %T"`

        let logAll
        try {
            logAll = await execSync(cm, { encoding: 'utf-8' })
        } catch (error) {
            logger.error(error.toString())
            this.reply(error.toString())
        }

        if (!logAll) return false

        logAll = logAll.split('\n')

        let log = []
        for (let str of logAll) {
            str = str.split('||')
            if (str[0] == this.oldCommitId) break
            if (str[1].includes('Merge branch')) continue
            log.push(str[1])
        }
        let line = log.length
        log = log.join('\n\n')

        if (log.length <= 0) return ''

        let title = `${plugin}更新日志，共${line}条`
        log = await common.makeForwardMsg(this.e, [title, log])

        return log
    }

    async updateLog() {
        let log = await this.getLog('bujidao')
        await this.reply(log)
    }

}