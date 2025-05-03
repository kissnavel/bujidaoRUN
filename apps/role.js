import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import plugin from '../../../lib/plugins/plugin.js'
import Abyss from '../model/abyss.js'
import Cfg from '../model/Cfg.js'

let command = Cfg.getConfig('command')
export class ji_role extends plugin {
  constructor() {
    super({
      name: '[寄]角色查询',
      dsc: '星铁角色信息查询',
      event: 'message',
      priority: Cfg.getConfig('config').priority,
      rule: [
        {
          reg: `^#星铁${command.roleIndex}[ |0-9]*$`,
          fnc: 'roleIndex'
        },
        {
          reg: `^#星铁${command.roleList}[ |0-9]*$`,
          fnc: 'roleList'
        },
        {
          reg: '^#*星铁武器星级更新$',//更新武器星级，短名
          permission: 'master',
          fnc: 'uprarity'
        }
      ]
    })
  }

  /** *角色 */
  async roleIndex() {
    let role = Cfg.getConfig('config').role
    if (!role) return false
    this.reply('角色数据获取中...')
    let data = await new Abyss(this.e).getIndex()
    if (!data) return false

    let img = await puppeteer.screenshot('StarRail/roleIndex', data)
    if (img) await this.reply(img)
  }

  /** 练度统计 */
  async roleList() {
    let role = Cfg.getConfig('config').role
    if (!role) return false
    let data = await new Abyss(this.e).roleList(this.e)
    if (!data) return false

    let img = await puppeteer.screenshot('StarRail/roleList', data)
    if (img) await this.reply(img)
  }

  async uprarity() {
    let role = Cfg.getConfig('config').role
    if (!role) return false
    await new Abyss(this.e).uprarity(this.e)
  }
}
