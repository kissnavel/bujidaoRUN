import fetch from 'node-fetch'
import MysApi from './mys/mysApi.js'

export default class getDeviceFp {
  static async Fp(uid, ck, game) {
    let ltuid = ck.ltuid
    let mysapi = new MysApi(uid, ck, {}, game)
    let deviceFp
    let bindInfo = await redis.get(`genshin:device_fp:${ltuid}:bind`)
    if (bindInfo) {
      deviceFp = await redis.get(`genshin:device_fp:${ltuid}:fp`)
      let data = {
        deviceFp
      }
      try {
        bindInfo = JSON.parse(bindInfo)
        data = {
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
      if (!deviceFp) {
        const sdk = mysapi.getUrl('getFp', data)
        const res = await fetch(sdk.url, {
          headers: sdk.headers,
          method: 'POST',
          body: sdk.body
        })
        const fpRes = await res.json()
        logger.debug(`[米游社][设备指纹]${JSON.stringify(fpRes)}`)
        deviceFp = fpRes?.data?.device_fp
        if (!deviceFp) {
          return { deviceFp: null }
        }
        await redis.set(`genshin:device_fp:${ltuid}:fp`, deviceFp, {
          EX: 86400 * 7
        })
        data['deviceFp'] = deviceFp
        const deviceLogin = mysapi.getUrl('deviceLogin', data)
        const saveDevice = mysapi.getUrl('saveDevice', data)
        if (!!deviceLogin && !!saveDevice) {
          logger.debug(`[米游社][设备登录]保存设备信息`)
          try {
            logger.debug(`[米游社][设备登录]${JSON.stringify(deviceLogin)}`)
            const login = await fetch(deviceLogin.url, {
              headers: deviceLogin.headers,
              method: 'POST',
              body: deviceLogin.body
            })
            const save = await fetch(saveDevice.url, {
              headers: saveDevice.headers,
              method: 'POST',
              body: saveDevice.body
            })
            const result = await Promise.all([login.json(), save.json()])
            logger.debug(`[米游社][设备登录]${JSON.stringify(result)}`)
          } catch (error) {
            logger.error(`[米游社][设备登录]${error.message}`)
          }
        }
      }
    } else {
      deviceFp = await redis.get(`genshin:device_fp:${uid}:fp`)
      let data = {
        deviceFp
      }
      if (!deviceFp) {
        const sdk = mysapi.getUrl('getFp')
        const res = await fetch(sdk.url, {
          headers: sdk.headers,
          method: 'POST',
          body: sdk.body
        })
        const fpRes = await res.json()
        logger.debug(`[米游社][设备指纹]${JSON.stringify(fpRes)}`)
        deviceFp = fpRes?.data?.device_fp
        if (!deviceFp) {
          return { deviceFp: null }
        }
        await redis.set(`genshin:device_fp:${uid}:fp`, deviceFp, {
          EX: 86400 * 7
        })
        if (!/^(18|[6-9])[0-9]{8}/i.test(uid)) {
          data['deviceFp'] = deviceFp
          const deviceLogin = mysapi.getUrl('deviceLogin', data)
          const saveDevice = mysapi.getUrl('saveDevice', data)
          if (!!deviceLogin && !!saveDevice) {
            logger.debug(`[米游社][设备登录]保存设备信息`)
            try {
              logger.debug(`[米游社][设备登录]${JSON.stringify(deviceLogin)}`)
              const login = await fetch(deviceLogin.url, {
                headers: deviceLogin.headers,
                method: 'POST',
                body: deviceLogin.body
              })
              const save = await fetch(saveDevice.url, {
                headers: saveDevice.headers,
                method: 'POST',
                body: saveDevice.body
              })
              const result = await Promise.all([login.json(), save.json()])
              logger.debug(`[米游社][设备登录]${JSON.stringify(result)}`)
            } catch (error) {
              logger.error(`[米游社][设备登录]${error.message}`)
            }
          }
        }
      }
    }

    return { deviceFp }
  }
}
