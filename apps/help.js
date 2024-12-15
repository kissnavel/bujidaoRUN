import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import plugin from '../../../lib/plugins/plugin.js'
import Help from '../model/help.js'
import Cfg from '../model/Cfg.js'
import _ from 'lodash'

let keys = _.map(Cfg.getCfgSchemaMap(), (i) => i.key)
let sysCfgReg = new RegExp(`^#寄设置\\s*(${keys.join('|')})?\\s*(.*)$`)
export class help extends plugin {
  constructor(e) {
    super({
      name: '寄帮助·设置',
      dsc: '',
      event: 'message.private',
      priority: Cfg.getConfig('config').priority,
      rule: [
        {
          reg: '^#?寄(命令|帮助|菜单|help|说明|功能|指令|使用说明)$',
          permission: 'master',
          fnc: 'help'
        },
        {
          reg: sysCfgReg,
          permission: 'master',
          fnc: 'admin'
        }
      ]
    })
  }

  async help() {
    let data = await Help.get(this.e)
    if (!data) return

    let img = await puppeteer.screenshot('bujidao/help', data)
    await this.reply(img)
  }

  async admin() {
    let regRet = sysCfgReg.exec(this.e.msg)
    if (!regRet) return true

    let data = await new Help(this.e).admin(regRet)
    if (!data) return

    let img = await puppeteer.screenshot('bujidao/admin', data)
    await this.reply(img)
  }
}
