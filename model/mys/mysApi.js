import cfg from '../../../../lib/config/config.js'
import apiTool from './apiTool.js'
import fetch from 'node-fetch'
import Cfg from '../Cfg.js'
import _ from 'lodash'
import md5 from 'md5'

let HttpsProxyAgent = ''
const _bbs = "fdv0fY9My9eA7MR0NpjGP9RjueFvjUSQ"
const _sr = "t0qEgfub6cvueAPgR5m9aQWWVciEer7v"
const _gs = 'fdv0fY9My9eA7MR0NpjGP9RjueFvjUSQ'
export default class MysApi {
  constructor(uid, cookie, option = {}, game = 'gs', Server = '') {
    this.uid = uid
    this.cookie = cookie
    this.game = game
    this.set = Cfg.getConfig('config')
    this.server = Server || this.getServer()
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

    let { url, query = '', body = '', types = '', sign = '' } = urlMap[type]

    if (query) url += `?${query}`
    if (body) body = JSON.stringify(body)

    this.forumid = data.forumid || ''
    let headers = this.getHeaders(types, query, body, sign)

    return { url, headers, body }
  }

  getServer() {
    switch (String(this.uid)[0]) {
      case '1':
      case '2':
        return this.game == 'sr' ? 'prod_gf_cn' : 'cn_gf01'
      case '5':
        return this.game == 'sr' ? 'prod_qd_cn' : 'cn_qd01'
      case '6':
        return this.game == 'sr' ? 'prod_official_usa' : 'os_usa'
      case '7':
        return this.game == 'sr' ? 'prod_official_euro' : 'os_euro'
      case '8':
      case '18':
        return this.game == 'sr' ? 'prod_official_asia' : 'os_asia'
      case '9':
        return this.game == 'sr' ? 'prod_official_cht' : 'os_cht'
    }
    return this.game == 'sr' ? 'prod_gf_cn' : 'cn_gf01'
  }

  async getData(type, data = {}, game = '', cached = false) {
    if (game) this.game = game
    let { url, headers, body } = this.getUrl(type, data)

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
      'x-rpc-app_version': '2.40.1',
      'x-rpc-client_type': '5',
      'x-rpc-device_id': this.device_id,
      'User-Agent': `Mozilla/5.0 (Linux; Android 12; YZ-${this.device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36 miHoYoBBS/2.40.1`,
      'Referer': 'https://webstatic.mihoyo.com'
    }

    const header1 = {
      'x-rpc-app_version': '2.40.1',
      "x-rpc-device_model": "Mi 10",
      'x-rpc-device_name': this.device,
      "x-rpc-channel": "miyousheluodi",
      'x-rpc-client_type': '2',
      "Referer": "https://app.mihoyo.com",
      "x-rpc-sys_version": "12",
      "User-Agent": "okhttp/4.8.0",
      'x-rpc-device_id': this.device_id
    }

    switch (types) {
      case 'bbs':
        return {
          ...header1,
          'DS': (sign ? this.bbsDs(query, body) : this.SignDs(_bbs))
        }
      case 'sign':
        return {
          ...header,
          'X-Requested-With': 'com.mihoyo.hyperion',
          'x-rpc-platform': 'android',
          'x-rpc-device_model': 'Mi 10',
          'x-rpc-device_name': this.device,
          'x-rpc-channel': 'miyousheluodi',
          'x-rpc-sys_version': '6.0.1',
          'DS': this.SignDs()
        }
      case 'noheader':
        return {}
    }
    return {
      ...header,
      'DS': this.getDs(query, body)
    }
  }

  getDs(q = '', b = '', salt = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs') {
    let t = Math.round(new Date().getTime() / 1000)
    let r = Math.floor(Math.random() * 900000 + 100000)
    let DS = md5(`salt=${salt}&t=${t}&r=${r}&b=${b}&q=${q}`)
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

    if (!this.server.startsWith('os')) return null

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
