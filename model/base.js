import Cfg from './Cfg.js'
import fs from 'node:fs'
import _ from 'lodash'

export default class base {
  constructor(e = {}) {
    this.e = e
    this.userId = Number(e?.user_id) || String(e?.user_id)
    this.model = 'bujidao'
    this.set = Cfg.getConfig('config')
    this.note = Cfg.getConfig('defnote')
    this.white = Cfg.getConfig('white')
    this.lable = Cfg.getConfig('lable')
    this.equip = Cfg.getConfig('equip')
    this._path = process.cwd().replace(/\\/g, '/')
  }

  get prefix() {
    return `Yz:bujidao:${this.model}:`
  }

  /**
   * 截图默认数据
   * @param saveId html保存id
   * @param tplFile 模板html路径
   * @param pluResPath 插件资源路径
   */
  get screenData() {
    let headImg
    if (this.e?.isZzz) {
      return {
        saveId: this.userId,
        cwd: this._path,
        tplFile: `./plugins/bujidao/resources/ZZZero/html/${this.model}/${this.model}.html`,
        /** 绝对路径 */
        fontsPath: `${this._path}/plugins/bujidao/resources/fonts/`,
        pluResPath: `${this._path}/plugins/bujidao/resources/ZZZero/`,
        genshinPath: `${this._path}/plugins/genshin/resources/`,
        headStyle: '',
        gstempFile: 'ZZZero/',
      }
    }
    if (this.e?.isSr) {
      headImg = _.sample(fs.readdirSync(`${this._path}/plugins/genshin/resources/StarRail/img/worldcard`).filter(file => file.endsWith('.png')))
      return {
        saveId: this.userId,
        cwd: this._path,
        tplFile: `./plugins/bujidao/resources/StarRail/html/${this.model}/${this.model}.html`,
        /** 绝对路径 */
        fontsPath: `${this._path}/plugins/bujidao/resources/fonts/`,
        pluResPath: `${this._path}/plugins/bujidao/resources/StarRail/`,
        genshinPath: `${this._path}/plugins/genshin/resources/`,
        headStyle: `<style> .head_box { background: url(${this._path}/plugins/genshin/resources/StarRail/img/worldcard/${headImg}) #fff; background-position-x: -10px; background-repeat: no-repeat; background-size: 540px; background-position-y: -100px; </style>`,
        gstempFile: 'StarRail/'
      }
    }

    headImg = _.sample(fs.readdirSync(`${this._path}/plugins/genshin/resources/img/namecard`).filter(file => file.endsWith('.png')))
    return {
      saveId: this.userId,
      cwd: this._path,
      tplFile: `./plugins/bujidao/resources/genshin/html/${this.model}/${this.model}.html`,
      /** 绝对路径 */
      fontsPath: `${this._path}/plugins/bujidao/resources/fonts/`,
      pluResPath: `${this._path}/plugins/bujidao/resources/genshin/`,
      genshinPath: `${this._path}/plugins/genshin/resources/`,
      headStyle: `<style> .head_box { background: url(${this._path}/plugins/genshin/resources/img/namecard/${headImg}) #fff; background-position-x: 42px; background-repeat: no-repeat; background-size: auto 101%; }</style>`,
      gstempFile: 'genshin/'
    }
  }
}
