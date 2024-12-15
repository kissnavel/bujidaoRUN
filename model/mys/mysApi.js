import cfg from '../../../../lib/config/config.js'
import apiTool from './apiTool.js'
import fetch from 'node-fetch'
import Cfg from '../Cfg.js'
import _ from 'lodash'
import md5 from 'md5'

let HttpsProxyAgent = ''
const _bbs = "WGtruoQrwczmsjLOPXzJLnaAYycsLavx"
export default class MysApi {
  constructor(uid, cookie, option = {}, game = 'gs', Server = '') {
    this.uid = uid
    this.cookie = cookie
    this.game = game
    this.set = Cfg.getConfig('config')
    this.server = Server || this.getServer(this.uid, this.game)
    this.device_id = this.getGuid()
    /** 5分钟缓存 */
    this.cacheCd = 300

    this.option = {
      log: true,
      ...option
    }
  }

  get device() {
    if (!this._device) this._device = `${md5(this.uid).substring(0, 5)}`
    return this._device
  }

  getUrl(type, data = {}) {
    let urlMap = new apiTool(this.uid, this.server, this.game).getUrlMap({ ...data, deviceId: this.device_id })
    if (!urlMap[type]) return false

    let { url, query = '', body = '', config = '', types = '', sign = '' } = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)

    this.forumid = data.forumid || ''
    let headers
    if (data.headers_) {
      data.headers_['DS'] = this.getDs(query, body)
      headers = data.headers_
    } else {
      headers = this.getHeaders(types, query, body, sign)
    }

    return { url, headers, body, config }
  }

  getServer() {
    const _uid = String(this.uid)
    const isSr = this.game == 'sr'
    const isZzz = this.game == 'zzz'
    if (isZzz) {
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
    return (isZzz || isSr) ? 'prod_gf_cn' : 'cn_gf01'
  }

  async getData(type, data = {}, game = '', cached = false) {
    if (!this._device_fp && !data?.Getfp && !data?.headers?.['x-rpc-device_fp'] && !data.headers_) {
      this._device_fp = await this.getData('getFp', { Getfp: true })
    }
    if (type === 'getFp' && !data?.Getfp) return this._device_fp

    if (game) this.game = game
    let { url, headers, body, config } = this.getUrl(type, data)

    if (!url) return false

    let cacheKey = this.cacheKey(type, data)
    let cahce = await redis.get(cacheKey)
    if (cahce) return JSON.parse(cahce)

    headers.Cookie = this.cookie

    if (data.headers) {
      headers = { ...headers, ...data.headers }
      delete data.headers
    }

    if (type == 'sign' && data.validate) {
      headers["x-rpc-challenge"] = data.challenge
      headers["x-rpc-validate"] = data.validate
      headers["x-rpc-seccode"] = `${data.validate}|jordan`
    }

    if (type !== 'getFp' && !headers['x-rpc-device_fp'] && this._device_fp.data?.device_fp && !data.headers_) {
      headers['x-rpc-device_fp'] = this._device_fp.data.device_fp
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
      'User-Agent': 'Mozilla/5.0 (Linux; Android 11; J9110 Build/55.2.A.4.332; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 miHoYoBBS/2.73.1'
    }

    const header_os = {
      'x-rpc-app_version': '2.57.1',
      'x-rpc-client_type': '2',
      'x-rpc-device_id': this.device_id,
      'User-Agent': 'Mozilla/5.0 (Linux; Android 11; J9110 Build/55.2.A.4.332; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 miHoYoBBSOversea/2.57.1',
      Referer: 'https://act.hoyolab.com/'
    }

    const header_bbs = {
      'x-rpc-app_version': '2.73.1',
      'x-rpc-device_model': 'J9110',
      'x-rpc-device_name': 'Sony J9110',
      'x-rpc-channel': 'miyousheluodi',
      'x-rpc-client_type': '2',
      Referer: 'https://app.mihoyo.com/',
      'x-rpc-sys_version': '11',
      'User-Agent': 'okhttp/4.9.3',
      'x-rpc-device_id': this.device_id
    }

    let client
    if (/cn_|_cn/.test(this.server)) {
      client = {
        ...header,
        Referer: 'https://webstatic.mihoyo.com/'
      }
    } else {
      client = header_os
    }

    switch (types) {
      case 'sign':// 细分签到
        if (/cn_|_cn/.test(this.server))
          return {
            ...header,
            ...(['cn_gf01', 'cn_qd01'].includes(this.server) ? {
              'x-rpc-signgame': 'hk4e'
            } : this.game == 'zzz' ? {
              'x-rpc-signgame': 'zzz'
            } : {}),
            Referer: 'https://act.mihoyo.com/',
            'X-Requested-With': 'com.mihoyo.hyperion',
            'x-rpc-platform': 'android',
            'x-rpc-device_model': 'J9110',
            'x-rpc-device_name': 'Sony J9110',
            'x-rpc-channel': 'miyousheluodi',
            'x-rpc-sys_version': '11',
            DS: this.SignDs()
          }
        else
          return {
            ...header_os,
            ...(this.game == 'zzz' ? {
              'x-rpc-signgame': 'zzz'
            } : {}),
            'X-Requested-With': 'com.mihoyo.hoyolab',
            'x-rpc-platform': 'android',
            'x-rpc-device_model': 'J9110',
            'x-rpc-device_name': 'Sony J9110',
            'x-rpc-channel': 'google',
            'x-rpc-sys_version': '11',
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
    if (/cn_|_cn/.test(this.server)) {
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

    if (/cn_|_cn/.test(this.server)) return null

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
