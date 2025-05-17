import cfg from '../../../../lib/config/config.js'
import apiTool from './apiTool.js'
import fetch from 'node-fetch'
import Cfg from '../Cfg.js'
import _ from 'lodash'
import md5 from 'md5'

let HttpsProxyAgent = ''
const _bbs = "WGtruoQrwczmsjLOPXzJLnaAYycsLavx"
export default class MysApi {
  constructor(uid, cookie, option = {}, game = 'gs', Server = '', Biz = '') {
    this.uid = uid
    this.cookie = cookie
    this.game = game
    this.set = Cfg.getConfig('config')
    this.server = Server || this.getServer()
    this.biz = Biz
    this.device_id = this.getGuid()
    /** 5分钟缓存 */
    this.cacheCd = 300

    this.option = {
      log: true,
      ...option
    }

    this.types = [
      'dailyNote',
      'character',
      'character_detail',
      'index',
      'spiralAbyss',
      'avatarInfo',
      'detail',
      'detail_equip',
      'detail_avatar',
      'rogue'
    ]
  }

  get device() {
    if (!this._device) this._device = `${md5(this.uid).substring(0, 5)}`
    return this._device
  }

  getUrl(type, data = {}) {
    let urlMap = new apiTool(this.uid, this.server, this.game, this.biz).getUrlMap({ ...data, deviceId: this.device_id })
    if (!urlMap[type]) return false

    let { url, query = '', body = '', config = '', types = '', sign = '' } = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)

    this.forumid = data.forumid || ''
    let headers = this.getHeaders(types, query, body, sign)

    // 如果有设备指纹，写入设备指纹
    if (data.deviceFp) {
      headers['x-rpc-device_fp'] = data.deviceFp
      // 兼容喵崽
      this._device_fp = { data: { device_fp: data.deviceFp } }
    }

    // 如果有设备ID，写入设备ID（传入的，这里是绑定设备方法1中的设备ID）
    if (data.deviceId) headers['x-rpc-device_id'] = data.deviceId

    // 如果有绑定设备信息，写入绑定设备信息，否则写入默认设备信息
    if (data?.deviceInfo && data?.modelName && data?.osVersion) {
      const osVersion = data.osVersion
      const modelName = data.modelName
      const deviceBrand = data.deviceInfo?.split('/')[0]
      const deviceDisplay = data.deviceInfo?.split('/')[3]
      try {
        headers['x-rpc-device_name'] = `${deviceBrand} ${modelName}`
        headers['x-rpc-device_model'] = modelName
        headers['x-rpc-csm_source'] = 'myself'
        // 国际服不需要绑定设备，故写入的'User-Agent'为国服
        headers['User-Agent'] = `Mozilla/5.0 (Linux; Android ${osVersion}; ${modelName} Build/${deviceDisplay}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.88 Mobile Safari/537.36 miHoYoBBS/2.73.1`
      } catch (error) {
        logger.error(`[bujidao]设备信息解析失败：${error.message}`)
      }
    } else {
      try {
        headers['x-rpc-device_name'] = 'Sony XQ-AT52'
        headers['x-rpc-device_model'] = 'XQ-AT52'
        headers['x-rpc-csm_source'] = 'myself'
      } catch (error) {
        logger.error(`[bujidao]设备信息解析失败：${error.message}`)
      }
    }

    if (type == 'deviceLogin' || type == 'saveDevice') {
      try {
        headers['x-rpc-sys_version'] = '12'
        headers['x-rpc-client_type'] = '2'
        headers['x-rpc-channel'] = 'miyousheluodi'
        headers['x-rpc-csm_source'] = 'home'
        headers['Host'] = 'bbs-api.miyoushe.com'
        headers['User-Agent'] = 'okhttp/4.9.3'
        headers['Referer'] = 'https://app.mihoyo.com/'
        headers['DS'] = this.SignDs(_bbs)
      } catch (error) {
        logger.error(`[bujidao]设备信息解析失败：${error.message}`)
      }
    }

    return { url, headers, body, config }
  }

  getServer() {
    const _uid = String(this.uid)
    const isSr = this.game == 'sr'
    const isZzz = this.game == 'zzz'
    const isWd = this.game == 'wd'
    if (isWd) {
      switch (_uid.slice(0, -7)) {
        case '11':
          return 'cn_prod_bb01'
        case '21':
          return 'cn_prod_mix01'
        case '10':
          return 'tw_prod_wd01'
        case '20':
          return 'glb_prod_wd01'
      }
    } else if (isZzz) {
      switch (_uid.slice(0, -8)) {
        case '10':
          return 'prod_gf_us'
        case '15':
          return 'prod_gf_eu'
        case '13':
          return 'prod_gf_jp'
        case '17':
          return 'prod_gf_sg'
      }
    } else {
      switch (_uid.slice(0, -8)) {
        case '5':
          return isSr ? 'prod_qd_cn' : 'cn_qd01'
        case '6':
          return isSr ? 'prod_official_usa' : 'os_usa'
        case '7':
          return isSr ? 'prod_official_euro' : 'os_euro'
        case '8':
        case '18':
          return isSr ? 'prod_official_asia' : 'os_asia'
        case '9':
          return isSr ? 'prod_official_cht' : 'os_cht'
      }
    }
    return isWd ? 'cn_prod_gf01' : (isZzz || isSr) ? 'prod_gf_cn' : 'cn_gf01'
  }

  async getData(type, data = {}, game = '', cached = false) {
    const ck = this.cookie
    const ltuid = ck.ltuid
    if (ltuid) {
      let bindInfo = await redis.get(`genshin:device_fp:${ltuid}:bind`)
      if (bindInfo) {
        try {
          bindInfo = JSON.parse(bindInfo)
          data = {
            ...data,
            productName: bindInfo?.deviceProduct,
            deviceType: bindInfo?.deviceName,
            modelName: bindInfo?.deviceModel,
            oaid: bindInfo?.oaid,
            osVersion: bindInfo?.androidVersion,
            deviceInfo: bindInfo?.deviceFingerprint,
            board: bindInfo?.deviceBoard
          }
        } catch (error) {
          bindInfo = null
        }
      }
    }
    if (this.types.includes(type)) {
      if (!this._device_fp && !data?.Getfp && !data?.headers?.['x-rpc-device_fp']) {
        this._device_fp = await this.getData('getFp', {
          ...data,
          Getfp: true
        })
      }
      if (type === 'getFp' && !data?.Getfp) return this._device_fp
    }

    const device_fp = await redis.get(`genshin:device_fp:${ltuid}:fp`)
    if (device_fp) data.deviceFp = device_fp
    const device_id = await redis.get(`genshin:device_fp:${ltuid}:id`)
    if (device_id) data.deviceId = device_id

    if (game) this.game = game
    let { url, headers, body, config } = this.getUrl(type, data)

    if (!url) return false

    let cacheKey = this.cacheKey(type, data)
    let cahce = await redis.get(cacheKey)
    if (cahce) return JSON.parse(cahce)

    headers.Cookie = ck

    if (data.headers) {
      headers = { ...headers, ...data.headers }
      delete data.headers
    }

    if (type == 'sign' && data.validate) {
      headers["x-rpc-challenge"] = data.challenge
      headers["x-rpc-validate"] = data.validate
      headers["x-rpc-seccode"] = `${data.validate}|jordan`
    }

    if (this.types.includes(type)) {
      if (type !== 'getFp' && !headers['x-rpc-device_fp'] && this._device_fp.data?.device_fp) {
        headers['x-rpc-device_fp'] = this._device_fp.data.device_fp
      }
    }

    let param = {
      headers,
      agent: await this.getAgent(),
      timeout: 10000
    }
    if (body) {
      param.method = 'post'
      param.body = body
    } else {
      param.method = 'get'
    }
    let response = {}

    if (this.set.isLog)
      logger.error(`[米游社接口][${type}][${this.uid}] ${url} ${JSON.stringify(param)}`)

    if (type == 'recognize' || type == 'results') {
      param = {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: config
      }
    }

    try {
      response = await fetch(url, param)
    } catch (error) {
      logger.error(error.toString())
      return false
    }

    if (!response.ok) {
      logger.error(`[米游社接口][${type}][${this.uid}] ${response.status} ${response.statusText}`)
      return false
    }

    let res = await response.text()
    if (typeof res === 'string')
      if (res.startsWith('('))
        res = JSON.parse((res).replace(/\(|\)/g, ""))
      else
        res = JSON.parse(res)
    else
      return false

    if (!res) {
      logger.mark('mys接口没有返回')
      return false
    }

    res.api = type

    if (this.set.resLog)
      logger.error(`[米游社接口][${type}][${this.uid}]${JSON.stringify(res)}`)

    if (cached) this.cache(res, cacheKey)

    return res
  }

  getHeaders(types, query = '', body = '', sign = false) {
    const header = {
      'x-rpc-app_version': '2.73.1',
      'x-rpc-client_type': '5',
      'x-rpc-device_id': this.device_id,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 12; XQ-AT52 Build/58.2.A.7.93; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.88 Mobile Safari/537.36 miHoYoBBS/2.73.1',
      Referer: 'https://webstatic.mihoyo.com/'
    }

    const header_os = {
      'x-rpc-app_version': '2.57.1',
      'x-rpc-client_type': '2',
      'x-rpc-device_id': this.device_id,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 12; XQ-AT52 Build/58.2.A.7.93; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.88 Mobile Safari/537.36 miHoYoBBSOversea/2.57.1',
      Referer: 'https://act.hoyolab.com/'
    }

    const header_bbs = {
      'x-rpc-app_version': '2.73.1',
      'x-rpc-channel': 'miyousheluodi',
      'x-rpc-client_type': '2',
      Referer: 'https://app.mihoyo.com/',
      'User-Agent': 'okhttp/4.9.3',
      'x-rpc-device_id': this.device_id,
      'x-rpc-device_model': 'XQ-AT52',
      'x-rpc-device_name': 'Sony XQ-AT52',
      'x-rpc-sys_version': '12'
    }

    let client
    if (['bh3_cn', 'bh2_cn'].includes(this.biz) || /cn_|_cn/.test(this.server)) {
      client = header
    } else {
      client = header_os
    }

    let signgame = this.game == 'gs' ? 'hk4e' : this.game == 'sr' ? 'hkrpg' : this.game == 'zzz' ? 'zzz' : this.game == 'bh3' ? 'bh3' : this.game == 'bh2' ? 'bh2' : 'nxx'
    let x_rpc = {
      'x-rpc-device_model': 'XQ-AT52',
      'x-rpc-device_name': 'Sony XQ-AT52',
      'x-rpc-sys_version': '12',
      'x-rpc-signgame': signgame,
      'x-rpc-platform': 'android'
    }

    switch (types) {
      // 细分签到
      case 'sign':
        if (['bh3_cn', 'bh2_cn'].includes(this.biz) || /cn_|_cn/.test(this.server))
          return {
            ...header,
            ...x_rpc,
            'X-Requested-With': 'com.mihoyo.hyperion',
            'x-rpc-channel': 'miyousheluodi',
            DS: this.SignDs()
          }
        else
          return {
            ...header_os,
            ...x_rpc,
            'X-Requested-With': 'com.mihoyo.hoyolab',
            'x-rpc-channel': 'google',
            DS: this.SignDs()
          }
      case 'bbs':
        return {
          ...header_bbs,
          DS: (sign ? this.bbsDs(query, body) : this.SignDs(_bbs))
        }
      case 'noheader':
        return {}
    }
    return {
      ...client,
      DS: this.getDs(query, body)
    }
  }

  getDs (q = '', b = '') {
    let n = ''
    if (['bh3_cn', 'bh2_cn'].includes(this.biz) || /cn_|_cn/.test(this.server)) {
      n = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs'
    } else {
      n = 'okr4obncj8bw5a65hbnn5oo6ixjc3l9w'
    }
    let t = Math.round(new Date().getTime() / 1000)
    let r = Math.floor(Math.random() * 900000 + 100000)
    let DS = md5(`salt=${n}&t=${t}&r=${r}&b=${b}&q=${q}`)
    return `${t},${r},${DS}`
  }

  bbsDs(q = "", b, salt = "t0qEgfub6cvueAPgR5m9aQWWVciEer7v") {
    let t = Math.floor(Date.now() / 1000)
    let r = _.random(100001, 200000)
    let DS = md5(`salt=${salt}&t=${t}&r=${r}&b=${b}&q=${q}`)
    return `${t},${r},${DS}`
  }

  SignDs(salt = 'jEpJb9rRARU2rXDA9qYbZ3selxkuct9a') {
    const t = Math.floor(Date.now() / 1000)
    let r = this.getGuid(6)
    const DS = md5(`salt=${salt}&t=${t}&r=${r}`)
    return `${t},${r},${DS}`
  }

  getGuid(length = 32) {
    let r = '';
    for (let i = 0; i < length; i++)
      r += _.sample('abcdefghijklmnopqrstuvwxyz0123456789')
    return r
  }

  cacheKey(type, data) {
    return `Yz:${this.game}:mys:cache:` + md5(this.uid + type + JSON.stringify(data))
  }

  async cache(res, cacheKey) {
    if (res?.retcode !== 0) return
    redis.setEx(cacheKey, this.cacheCd, JSON.stringify(res))
  }

  async getAgent() {
    let proxyAddress = cfg.bot.proxyAddress
    if (!proxyAddress) return null
    if (proxyAddress === 'http://0.0.0.0:0') return null

    if (['bh3_cn', 'bh2_cn'].includes(this.biz) || /cn_|_cn/.test(this.server)) return null

    if (HttpsProxyAgent === '') {
      HttpsProxyAgent = await import('https-proxy-agent').catch((err) => {
        logger.error(err)
      })

      HttpsProxyAgent = HttpsProxyAgent ? HttpsProxyAgent.HttpsProxyAgent : undefined
    }

    if (HttpsProxyAgent)
      return new HttpsProxyAgent(proxyAddress)

    return null
  }
}
