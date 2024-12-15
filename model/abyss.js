import common from '../../../lib/common/common.js'
import MysInfo from './mys/mysInfo.js'
import mysApi from './mys/mysApi.js'
import base from './base.js'
import Cfg from './Cfg.js'
import fs from 'node:fs'
import _ from 'lodash'

export default class Abyss extends base {
  constructor(e) {
    super(e)
    this.model = 'abyss'
  }

  /** 深渊十二层 */
  async getAbyss() {
    let scheduleType = '1'
    if (this.e.msg.includes('上期') || this.e.msg.includes('往期')) scheduleType = '2'

    let device_fp = await MysInfo.get(this.e, 'getFp', {}, {}, true)
    if (device_fp?.retcode !== 0) return false
    let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }

    let res = await MysInfo.get(this.e, 'spiralAbyss', { schedule_type: scheduleType, headers }, {}, true)
    if (res?.retcode !== 0) return false

    if (!res.data?.has_data) {
      this.e.reply(`UID:${this.e.uid},混沌回忆数据还未更新`)
      return false
    }

    return {
      ...this.screenData,
      saveId: this.e.uid,
      quality: 100,
      uid: this.e.uid,
      list: res.data,
    }
  }

  /** 模拟宇宙 */
  async getRogue() {
    let thisMonth = !(this.e.msg.includes('上期') || this.e.msg.includes('往期'))
    this.model = 'rogue'

    let device_fp = await MysInfo.get(this.e, 'getFp', {}, {}, true)
    if (device_fp?.retcode !== 0) return false
    let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }

    let res = await MysInfo.get(this.e, 'rogue', { headers }, {}, true)
    if (res?.retcode !== 0) return false

    if (!res.data?.[`${thisMonth ? 'current' : 'last'}_record`]?.has_data) {
      this.e.reply(`UID:${this.e.uid},模拟宇宙数据还未更新`)
      return false
    }

    let line = [
      [
        { lable: '技能树', num: res.data.basic_info.unlocked_skill_points, extra: this.lable.skill_points },
        { lable: '解锁奇物', num: res.data.basic_info.unlocked_miracle_num, extra: this.lable.miracle },
        { lable: '解锁祝福', num: res.data.basic_info.unlocked_buff_num, extra: this.lable.buff },
        { lable: '通关次数', num: res.data.current_record.basic.finish_cnt }
      ]
    ]

    return {
      ...this.screenData,
      saveId: this.e.uid,
      quality: 100,
      uid: this.e.uid,
      line,
      role: res.data.role,
      records: res.data[`${thisMonth ? 'current' : 'last'}_record`].records
    }
  }

  async getIndex() {
    this.model = 'roleIndex'

    let ApiData = {
      index: '',
      spiralAbyss: { schedule_type: '1', },
      avatarInfo: ''
    }

    let device_fp = await MysInfo.get(this.e, 'getFp', {}, {}, true)
    if (device_fp?.retcode !== 0) return false
    let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }

    let res = await MysInfo.get(this.e, ApiData, { headers }, {}, true)

    if (!res || res[0].retcode !== 0 || res[2].retcode !== 0) return false

    let ret = []
    res.forEach(v => ret.push(v.data))

    /** 截图数据 */
    let data = {
      quality: 100,
      ...this.screenData,
      ...this.dealData(ret)
    }
    return data
  }

  dealData(data) {
    let [resIndex, resAbyss, resDetail] = data

    let avatars = resDetail.avatar_list || []

    for (let avatar of avatars) {
      let rarity = avatar.rarity
      let liveNum = avatar.rank
      let level = avatar.level
      let id = avatar.id - 1000

      if (rarity >= 5) rarity = 5

      avatar.sortLevel = level
      // id倒序，最新出的角色拍前面
      avatar.sort = rarity * 100000 + liveNum * 10000 + level * 100 + id
      for (let type of ['role', 'weapon']) {
        if (type == 'weapon' && !avatar.equip) continue
        avatar[`${type}Img`] = `${this.screenData.genshinPath}StarRail/img/${type}/${type == 'role' ? avatar.name : avatar.equip.name}.webp`
        if (!fs.existsSync(avatar[`${type}Img`]))
          avatar[`${type}Img`] = type == 'role' ? avatar.icon : avatar.equip.icon
      }
      if (avatar.equip)
        avatar.equip.name = this.equip.shortEquip[avatar.equip.name] || avatar.equip.name
    }

    let stats = resIndex.stats || {}

    let line = [
      [
        { lable: '角色数', num: stats.avatar_num, extra: this.lable.avatar },
        { lable: '成就', num: stats.achievement_num, extra: this.lable.achievement },
        { lable: '战利品', num: stats.chest_num, extra: this.lable.chest }
      ]
    ]

    if (avatars.length > 0) {
      // 重新排序
      avatars = _.chain(avatars).orderBy(['sortLevel'], ['desc'])
      avatars = avatars.orderBy(['sort'], ['desc']).value()
    }

    let abyss = resAbyss
    let list = {}
    abyss.list = []
    for (let item of abyss.all_floor_detail) {
      for (let i of ['node_1', 'node_2']) {
        for (let avatar of item[i].avatars) {
          if (!list[avatar.id]) {
            avatar.value = 1
            list[avatar.id] = avatar
          } else {
            list[avatar.id].value++
          }
        }
      }
    }
    for (let i in list)
      abyss.list.push(list[i])
    abyss.list = abyss.list.sort((a, b) => b.value - a.value).slice(0, 4)

    return {
      uid: this.e.uid,
      saveId: this.e.uid,
      quality: 100,
      activeDay: this.dayCount(stats.active_days),
      line,
      avatars,
      abyss,
    }
  }

  async roleList() {
    this.model = 'roleList'
    await this.e.reply('正在获取角色信息，请稍候...')

    let device_fp = await MysInfo.get(this.e, 'getFp', {}, {}, true)
    if (device_fp?.retcode !== 0) return false
    let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }

    let res = await MysInfo.get(this.e, 'avatarInfo', { headers }, {}, true)
    if (res?.retcode !== 0) return false

    let avatars = res.data.avatar_list
    if (avatars.length <= 0) return false

    this.ck = await MysInfo.checkUidBing(this.e.uid, this.e)

    let skill = []
    if (this.ck) {
      this.mysApi = new mysApi(this.e.uid, this.ck.ck, { log: false }, 'sr')
      skill = await this.getAllSkill(avatars)
    }

    /** 截图数据 */
    let data = {
      ...this.screenData,
      quality: 100,
      saveId: this.e.uid,
      uid: this.e.uid,
      ...await this.ListData(avatars, skill),
      _res_path: `${this._path}/plugins/miao-plugin/resources/`
    }

    return data
  }

  async getAllSkill(avatars) {
    let skillRet = []; let skill = []
    // 批量获取技能数据，分组10个id一次，延迟100ms
    let num = 10; let ms = 100
    let avatarArr = _.chunk(avatars, num)

    let start = Date.now()

    for (let val of avatarArr) {
      for (let avatar of val)
        skillRet.push(this.getSkill(avatar))
      skillRet = await Promise.all(skillRet)

      // 过滤没有获取成功的
      skillRet.filter(item => item.a)
      skillRet = skillRet.filter(item => item.a)

      await common.sleep(ms)
    }
    skill = _.keyBy(skillRet, 'id')
    logger.mark(`[米游社接口][detail][${this.ck.uid}] ${Date.now() - start}ms`)
    return skill
  }

  async getSkill(avatar) {
    let device_fp = await this.mysApi.getData('getFp')
    if (device_fp?.retcode !== 0) return false
    let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }

    let res = await this.mysApi.getData('detail', { avatar_id: avatar.id, headers }, '', true)
    if (res?.retcode !== 0 || !res?.data?.skills) return false

    let skill = { id: avatar.id }

    for (let val of res.data.skills) {
      val.level_original = val.cur_level
      if (val.anchor == 'Point01') {
        skill.a = val
        continue
      }
      if (val.anchor == 'Point02') {
        skill.e = val
        continue
      }
      if (val.anchor == 'Point03') {
        skill.q = val
        continue
      }
      if (val.anchor == 'Point04') {
        skill.w = val
        continue
      }
    }
    
    if (avatar.rank >= 3) {
      for (let item of avatar.ranks) {
        if (!item.is_unlocked && (item.pos !== 3 || item.pos !== 5)) continue
        if (/普攻等级\+(\d+)/.test(item.desc))
          skill.a.cur_level += Number(item.desc.match(/普攻等级\+(\d+)/)[1])
        if (/战技等级\+(\d+)/.test(item.desc))
          skill.e.cur_level += Number(item.desc.match(/战技等级\+(\d+)/)[1])
        if (/终结技等级\+(\d+)/.test(item.desc))
          skill.q.cur_level += Number(item.desc.match(/终结技等级\+(\d+)/)[1])
        if (/天赋等级\+(\d+)/.test(item.desc))
          skill.w.cur_level += Number(item.desc.match(/天赋等级\+(\d+)/)[1])
      }
    }

    return skill
  }

  async ListData(avatars, skill) {
    let avatarRet = []
    for (let curr of avatars) {
      let avatar = _.pick(curr, 'id,name,rarity,level,rank,icon,equip'.split(','))
      avatar.rarity = avatar.rarity > 5 ? 5 : avatar.rarity

      if (avatar.equip?.id)
        avatar.equip_rarity = this.equip.rarity_5.includes(Number(avatar.equip.id)) ? 5 : this.equip.rarity_4.includes(Number(avatar.equip.id)) ? 4 : 3
      else
        avatar.equip_rarity = 1

      for (let type of ['role', 'weapon']) {
        if (type == 'weapon' && !avatar.equip) continue
        avatar[`${type}Img`] = `${this.screenData.genshinPath}StarRail/img/${type}/${type == 'role' ? avatar.name : avatar.equip.name}.webp`
        if (!fs.existsSync(avatar[`${type}Img`]))
          avatar[`${type}Img`] = type == 'role' ? avatar.icon : avatar.equip.icon
      }

      avatar.name = this.equip.shortAvatar[avatar.name] || avatar.name
      if (avatar.equip)
        avatar.equip.name = this.equip.shortEquip[avatar.equip.name] || avatar.equip.name

      let skillRet = skill[avatar.id] || {}
      const talentConsCfg = { a: 0, e: 3, q: 5, w: 5 }
      const talentLvMap = '0,1,1,1,2,2,3,3,4,5,5'.split(',')
      const talentLvMap2 = '0,1,2,3,3,4,6'.split(',')

      _.forIn(talentConsCfg, (consLevel, key) => {
        let talent = skillRet[key] || {}
        avatar[key] = talent.cur_level || '-'
        avatar[`${key}_plus`] = talent.cur_level > talent.level_original
        if (key == 'a')
          avatar[`${key}_lvl`] = talentLvMap2[talent.level_original * 1]
        else
          avatar[`${key}_lvl`] = talentLvMap[talent.level_original * 1]
      })
      avatar.aeq = avatar.a * 1 + avatar.e + avatar.q + avatar.w
      avatarRet.push(avatar)
    }

    let sortKey = 'level,rarity,aeq,rank'.split(',')

    avatarRet = _.orderBy(avatarRet, sortKey, _.repeat('desc,', sortKey.length).split(','))

    let noTalent = avatarRet.length == 0 || /^-+$/.test(avatarRet.map((d) => d.a).join(''))

    let talentNotice = `*技能数据会缓存30分钟`
    if (noTalent)
      talentNotice = '【#扫码登录】或【#刷新ck】后可获取技能数据。'

    return {
      avatars: avatarRet,
      talentNotice
    }
  }

  async uprarity() {
    let apiData = {
      detail_equip: '',
      detail_avatar: ''
    }

    let device_fp = await MysInfo.get(this.e, 'getFp', {}, {}, true)
    if (device_fp?.retcode !== 0) return false
    let headers = { 'x-rpc-device_fp': device_fp?.data?.device_fp }

    let res = await MysInfo.get(this.e, apiData, { headers }, {}, true)
    if (res?.[0].data?.list.length == 0 || res?.[1].data?.list.length == 0) return false

    for (let item of res[0].data.list) {
      if (!this.equip[`rarity_${item.rarity}`]?.includes(Number(item.item_id)))
        this.equip[`rarity_${item.rarity}`].push(Number(item.item_id))
      if (!this.equip.shortEquip[item.item_name])
        this.equip.shortEquip[item.item_name] = item.item_name
    }
    for (let item of res[1].data.list)
      if (!this.equip.shortAvatar[item.item_name])
        this.equip.shortAvatar[item.item_name] = item.item_name

    Cfg.setConfig('equip', this.equip)
    await this.e.reply('更新完成，无需重启')
    return true
  }

  dayCount(num) {
    let daysDifference = Math.floor((new Date() - new Date('2023-04-25')) / (1000 * 60 * 60 * 24))
    let msg = '活跃天数：' + Math.floor(num) + `/${daysDifference}天`
    return msg
  }
}