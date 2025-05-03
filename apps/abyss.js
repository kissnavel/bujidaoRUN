import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import plugin from '../../../lib/plugins/plugin.js'
import Abyss from '../model/abyss.js'
import Cfg from '../model/Cfg.js'

let command = Cfg.getConfig('command')
export class ji_abyss extends plugin {
  constructor() {
    super({
      name: '[寄]深渊查询',
      dsc: '星铁深渊信息查询',
      event: 'message',
      priority: Cfg.getConfig('config').priority,
      rule: [
        {
          reg: `^#星铁[上期|往期|本期]*${command.abyss}[上期|往期|本期]*[ |0-9]*$`,
          fnc: 'abyss'
        },
        {
          reg: `^#星铁[上期|往期|本期]*${command.rogue}[上期|往期|本期]*[ |0-9]*$`,
          fnc: 'rogue'
        }
      ]
    })
  }

  /** 忘却之庭 */
  async abyss() {
    let abyss = Cfg.getConfig('config').abyss
    if (!abyss) return false
    this.reply('忘却之庭数据获取中...')
    let data = await new Abyss(this.e).getAbyss()
    if (!data) return false

    let img = await puppeteer.screenshot('StarRail/abyss', data)
    if (img) await this.reply(img)
  }

  /** 模拟宇宙*/
  async rogue() {
    let abyss = Cfg.getConfig('config').abyss
    if (!abyss) return false
    this.reply('模拟宇宙数据获取中...')
    let data = await new Abyss(this.e).getRogue()
    if (!data) return false

    let img = await puppeteer.screenshot('StarRail/rogue', data)
    if (img) await this.reply(img)
  }
}
