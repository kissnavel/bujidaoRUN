import Cfg from '../Cfg.js'
import crypto from 'crypto'

export default class apiTool {
  constructor(uid, server, game = 'gs', biz) {
    this.uid = uid
    this.server = server
    this.game = game
    this.biz = biz
    this.api = Cfg.getConfig('api')
    this.uuid = crypto.randomUUID()
  }

  getUrlMap = (data = {}) => {
    const productName = data?.productName ?? 'J9110'
    const deviceType = data?.deviceType ?? 'J9110'
    const modelName = data?.modelName ?? 'J9110'
    const oaid = data?.oaid ?? this.uuid
    const osVersion = data?.osVersion ?? '11'
    const deviceInfo = data?.deviceInfo ?? 'Sony/J9110/J9110:11/55.2.A.4.332/055002A004033203408384484:user/release-keys'
    const board = data?.board ?? 'msmnile'
    const deviceBrand = deviceInfo.split('/')[0]
    const deviceDisplay = deviceInfo.split('/')[3]
    let Bbs_api = 'https://bbs-api.miyoushe.com/'
    let bbs_api = 'https://bbs-api.mihoyo.com/'
    let host, host_hk4e, host_nap, hostRecord, hostPublicData
    if (['bh3_cn', 'bh2_cn'].includes(this.biz) || /cn_|_cn/.test(this.server)) {
      host = 'https://api-takumi.mihoyo.com/'
      host_nap = 'https://act-nap-api.mihoyo.com/'
      hostRecord = 'https://api-takumi-record.mihoyo.com/'
      hostPublicData = 'https://public-data-api.mihoyo.com/'
    } else {
      host = 'https://sg-public-api.hoyolab.com/'
      host_hk4e = 'https://sg-hk4e-api.hoyolab.com/'
      host_nap = 'https://sg-act-nap-api.hoyolab.com/'
      hostRecord = 'https://bbs-api-os.hoyolab.com/'
      hostPublicData = 'https://sg-public-data-api.hoyoverse.com/'
    }

    let urlMap = {
      all: {
        createGeetest: {
          url: `${host}event/toolcomsrv/risk/createGeetest`,
          query: `is_high=true&app_key=${data.app_key}`
        },
        verifyGeetest: {
          url: `${host}event/toolcomsrv/risk/verifyGeetest`,
          body: {
            geetest_challenge: data.challenge,
            geetest_validate: data.validate,
            geetest_seccode: `${data.validate}|jordan`,
            app_key: data.app_key
          }
        },
        createVerification: {
          url: `${hostRecord}game_record/app/card/wapi/createVerification`,
          query: 'is_high=true'
        },
        verifyVerification: {
          url: `${hostRecord}game_record/app/card/wapi/verifyVerification`,
          body: {
            geetest_challenge: data.challenge,
            geetest_validate: data.validate,
            geetest_seccode: `${data.validate}|jordan`
          }
        },
        recognize: {
          url: `${this.api.api}`,
          config: `${this.api.key}&${this.api.query}&gt=${data.gt}&challenge=${data.challenge}`
        },
        results: {
          url: `${this.api.resapi}`,
          config: `${this.api.key}&resultid=${data.resultid}`
        }
      },
      bbs: {
        bbsisSign: {
          url: `${bbs_api}apihub/sapi/getUserMissionsState`,
          types: 'bbs'
        },
        bbsSign: {
          url: `${bbs_api}apihub/app/api/signIn`,
          body: {
            gids: data.signId
          },
          sign: true,
          types: 'bbs'
        },
        bbsGetCaptcha: {
          url: `${bbs_api}misc/api/createVerification`,
          query: 'is_high=false',
          types: 'bbs'
        },
        bbsCaptchaVerify: {
          url: `${bbs_api}misc/api/verifyVerification`,
          body: {
            "geetest_challenge": data.challenge,
            "geetest_validate": data.validate,
            "geetest_seccode": `${data.validate}|jordan`
          },
          types: 'bbs'
        },
        bbsPostList: {
          url: `${bbs_api}post/api/getForumPostList`,
          query: `forum_id=${data.forumId}&is_good=false&is_hot=false&page_size=20&sort_type=1`,
          types: 'bbs'
        },
        bbsPostFull: {
          url: `${bbs_api}post/api/getPostFull`,
          query: `post_id=${data.postId}`,
          types: 'bbs'
        },
        bbsReply: {
          url: `${bbs_api}post/api/releaseReply`,
          body: {
            "content": data.Replymsg,
            "post_id": data.postId,
            "reply_id": "",
            "structured_content": data.Replymsg
          },
          types: 'bbs'
        },
        bbsShareConf: {
          url: `${bbs_api}apihub/api/getShareConf`,
          query: `entity_id=${data.postId}&entity_type=1`,
          types: 'bbs'
        },
        bbsVotePost: {
          url: `${bbs_api}apihub/sapi/upvotePost`,
          body: {
            "post_id": data.postId,
            "is_cancel": false
          },
          types: 'bbs'
        }
      },
      gs: {
        ...(['cn_gf01', 'cn_qd01'].includes(this.server) ? {
          UserGame: {
            url: `${host}binding/api/getUserGameRolesByCookie`,
            query: `game_biz=hk4e_cn&region=${this.server}&game_uid=${this.uid}`
          },
          sign: {
            url: `${host}event/luna/sign`,// 国服原神签到
            body: { act_id: 'e202311201442471', region: this.server, uid: this.uid, lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/luna/info`,
            query: `lang=zh-cn&act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/luna/home`,
            query: 'lang=zh-cn&act_id=e202311201442471',
            types: 'sign'
          },
          getFp: {
            url: `${hostPublicData}device-fp/api/getFp`,
            body: {
              app_name: 'bbs_cn',
              bbs_device_id: `${this.uuid}`,
              device_fp: '38d7faa51d2b6',
              device_id: '35315696b7071100',
              ext_fields: `{"proxyStatus":1,"isRoot":0,"romCapacity":"512","deviceName":"${modelName}","productName":"${productName}","romRemain":"456","hostname":"BuildHost","screenSize":"1096x2434","isTablet":0,"aaid":"${this.uuid}","model":"${modelName}","brand":"${deviceBrand}","hardware":"qcom","deviceType":"${deviceType}","devId":"REL","serialNumber":"unknown","sdCapacity":107433,"buildTime":"1633631032000","buildUser":"BuildUser","simState":1,"ramRemain":"96757","appUpdateTimeDiff":1722171241616,"deviceInfo":"${deviceInfo}","vaid":"${this.uuid}","buildType":"user","sdkVersion":"30","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"chargeStatus":1,"manufacturer":"${deviceBrand}","emulatorStatus":0,"appMemory":"512","osVersion":"${osVersion}","vendor":"unknown","accelerometer":"-0.084346995x8.73799x4.6301117","sdRemain":96600,"buildTags":"release-keys","packageName":"com.mihoyo.hyperion","networkType":"WiFi","oaid":"${oaid}","debugStatus":1,"ramCapacity":"107433","magnetometer":"-13.9125x-17.8875x-5.4750004","display":"${deviceDisplay}","appInstallTimeDiff":1717065300325,"packageVersion":"2.20.2","gyroscope":"0.017714571x-4.5813544E-4x0.0015271181","batteryStatus":77,"hasKeyboard":0,"board":"${board}"}`,
              platform: '2',
              seed_id: `${this.uuid}`,
              seed_time: new Date().getTime() + ''
            }
          }
        } : {
          UserGame: {
            url: `${host}binding/api/getUserGameRolesByCookie`,
            query: `game_biz=hk4e_global&region=${this.server}&game_uid=${this.uid}`
          },
          sign: {
            url: `${host_hk4e}event/sol/sign`,// 国际服原神签到
            body: { act_id: 'e202102251931481', lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host_hk4e}event/sol/info`,
            query: 'lang=zh-cn&act_id=e202102251931481',
            types: 'sign'
          },
          sign_home: {
            url: `${host_hk4e}event/sol/home`,
            query: 'lang=zh-cn&act_id=e202102251931481',
            types: 'sign'
          },
          getFp: {
            url: `${hostPublicData}device-fp/api/getFp`,
            body: {
              app_name: 'bbs_oversea',
              device_fp: '38d7f2352506c',
              device_id: '35315696b7071100',
              ext_fields: `{"proxyStatus":1,"isRoot":0,"romCapacity":"512","deviceName":"${modelName}","productName":"${productName}","romRemain":"474","hostname":"BuildHost","screenSize":"1096x2434","isTablet":0,"model":"${modelName}","brand":"${deviceBrand}","hardware":"qcom","deviceType":"${deviceType}","devId":"REL","serialNumber":"unknown","sdCapacity":107433,"buildTime":"1633631032000","buildUser":"BuildUser","simState":1,"ramRemain":"96715","appUpdateTimeDiff":1722171191009,"deviceInfo":"${deviceInfo}","buildType":"user","sdkVersion":"30","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"app_set_id":"${this.uuid}","chargeStatus":1,"manufacturer":"${deviceBrand}","emulatorStatus":0,"appMemory":"512","adid":"${this.uuid}","osVersion":"${osVersion}","vendor":"unknown","accelerometer":"-0.22372891x-1.5332011x9.802497","sdRemain":96571,"buildTags":"release-keys","packageName":"com.mihoyo.hoyolab","networkType":"WiFi","debugStatus":1,"ramCapacity":"107433","magnetometer":"3.73125x-10.668751x3.7687502","display":"${deviceDisplay}","appInstallTimeDiff":1716489549794,"packageVersion":"2.20.2","gyroscope":"0.18386503x-0.006413896x-0.008857286","batteryStatus":77,"hasKeyboard":0,"board":"${board}"}`,
              hoyolab_device_id: `${this.uuid}`,
              platform: '2',
              seed_id: `${this.uuid}`,
              seed_time: new Date().getTime() + ''
            }
          }
        }),
        dailyNote: {
          url: `${hostRecord}game_record/app/genshin/api/dailyNote`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        character: {
          url: `${hostRecord}game_record/app/genshin/api/character/list`,
          body: { role_id: this.uid, server: this.server }
        },
        character_detail: {
          url: `${hostRecord}game_record/app/genshin/api/character/detail`,
          body: { role_id: this.uid, server: this.server, character_ids: data.ids }
        },
        deviceLogin: {
          url: `${Bbs_api}apihub/api/deviceLogin`,
          body: {
            app_version: '2.73.1',
            device_id: data.deviceId,
            device_name: `${deviceBrand}${modelName}`,
            os_version: '33',
            platform: 'Android',
            registration_id: this.generateSeed(19)
          }
        },
        saveDevice: {
          url: `${Bbs_api}apihub/api/saveDevice`,
          body: {
            app_version: '2.73.1',
            device_id: data.deviceId,
            device_name: `${deviceBrand}${modelName}`,
            os_version: '33',
            platform: 'Android',
            registration_id: this.generateSeed(19)
          }
        }
      },
      sr: {
        ...(['prod_gf_cn', 'prod_qd_cn'].includes(this.server) ? {
          UserGame: {
            url: `${host}binding/api/getUserGameRolesByCookie`,
            query: `game_biz=hkrpg_cn&region=${this.server}&game_uid=${this.uid}`
          },
          sign: {
            url: `${host}event/luna/sign`,// 国服星铁签到
            body: { act_id: 'e202304121516551', region: this.server, uid: this.uid, lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/luna/info`,
            query: `lang=zh-cn&act_id=e202304121516551&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/luna/home`,
            query: 'lang=zh-cn&act_id=e202304121516551',
            types: 'sign'
          },
          getFp: {
            url: `${hostPublicData}device-fp/api/getFp`,
            body: {
              app_name: 'bbs_cn',
              bbs_device_id: `${this.uuid}`,
              device_fp: '38d7faa51d2b6',
              device_id: '35315696b7071100',
              ext_fields: `{"proxyStatus":1,"isRoot":0,"romCapacity":"512","deviceName":"${modelName}","productName":"${productName}","romRemain":"456","hostname":"BuildHost","screenSize":"1096x2434","isTablet":0,"aaid":"${this.uuid}","model":"${modelName}","brand":"${deviceBrand}","hardware":"qcom","deviceType":"${deviceType}","devId":"REL","serialNumber":"unknown","sdCapacity":107433,"buildTime":"1633631032000","buildUser":"BuildUser","simState":1,"ramRemain":"96757","appUpdateTimeDiff":1722171241616,"deviceInfo":"${deviceInfo}","vaid":"${this.uuid}","buildType":"user","sdkVersion":"30","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"chargeStatus":1,"manufacturer":"${deviceBrand}","emulatorStatus":0,"appMemory":"512","osVersion":"${osVersion}","vendor":"unknown","accelerometer":"-0.084346995x8.73799x4.6301117","sdRemain":96600,"buildTags":"release-keys","packageName":"com.mihoyo.hyperion","networkType":"WiFi","oaid":"${oaid}","debugStatus":1,"ramCapacity":"107433","magnetometer":"-13.9125x-17.8875x-5.4750004","display":"${deviceDisplay}","appInstallTimeDiff":1717065300325,"packageVersion":"2.20.2","gyroscope":"0.017714571x-4.5813544E-4x0.0015271181","batteryStatus":77,"hasKeyboard":0,"board":"${board}"}`,
              platform: '2',
              seed_id: `${this.uuid}`,
              seed_time: new Date().getTime() + ''
            }
          }
        } : {
          UserGame: {
            url: `${host}binding/api/getUserGameRolesByCookie`,
            query: `game_biz=hkrpg_global&region=${this.server}&game_uid=${this.uid}`
          },
          sign: {
            url: `${host}event/luna/os/sign`,// 国际服星铁签到
            body: { act_id: 'e202303301540311', lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/luna/os/info`,
            query: 'lang=zh-cn&act_id=e202303301540311',
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/luna/os/home`,
            query: 'lang=zh-cn&act_id=e202303301540311',
            types: 'sign'
          },
          getFp: {
            url: `${hostPublicData}device-fp/api/getFp`,
            body: {
              app_name: 'bbs_oversea',
              device_fp: '38d7f2352506c',
              device_id: '35315696b7071100',
              ext_fields: `{"proxyStatus":1,"isRoot":0,"romCapacity":"512","deviceName":"${modelName}","productName":"${productName}","romRemain":"474","hostname":"BuildHost","screenSize":"1096x2434","isTablet":0,"model":"${modelName}","brand":"${deviceBrand}","hardware":"qcom","deviceType":"${deviceType}","devId":"REL","serialNumber":"unknown","sdCapacity":107433,"buildTime":"1633631032000","buildUser":"BuildUser","simState":1,"ramRemain":"96715","appUpdateTimeDiff":1722171191009,"deviceInfo":"${deviceInfo}","buildType":"user","sdkVersion":"30","ui_mode":"UI_MODE_TYPE_NORMAL","isMockLocation":0,"cpuType":"arm64-v8a","isAirMode":0,"ringMode":2,"app_set_id":"${this.uuid}","chargeStatus":1,"manufacturer":"${deviceBrand}","emulatorStatus":0,"appMemory":"512","adid":"${this.uuid}","osVersion":"${osVersion}","vendor":"unknown","accelerometer":"-0.22372891x-1.5332011x9.802497","sdRemain":96571,"buildTags":"release-keys","packageName":"com.mihoyo.hoyolab","networkType":"WiFi","debugStatus":1,"ramCapacity":"107433","magnetometer":"3.73125x-10.668751x3.7687502","display":"${deviceDisplay}","appInstallTimeDiff":1716489549794,"packageVersion":"2.20.2","gyroscope":"0.18386503x-0.006413896x-0.008857286","batteryStatus":77,"hasKeyboard":0,"board":"${board}"}`,
              hoyolab_device_id: `${this.uuid}`,
              platform: '2',
              seed_id: `${this.uuid}`,
              seed_time: new Date().getTime() + ''
            }
          }
        }),
        dailyNote: {
          url: `${hostRecord}game_record/app/hkrpg/api/note`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        index: {
          url: `${hostRecord}game_record/app/hkrpg/api/index`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        spiralAbyss: {
          url: `${hostRecord}game_record/app/hkrpg/api/challenge`,
          query: `isPrev=true&need_all=true&role_id=${this.uid}&schedule_type=${data.schedule_type}&server=${this.server}`
        },
        avatarInfo: {
          url: `${hostRecord}game_record/app/hkrpg/api/avatar/info`,
          query: `need_wiki=true&role_id=${this.uid}&server=${this.server}`
        },
        detail: {
          url: `${host}event/rpgcalc/avatar/detail`,
          query: `game=hkrpg&lang=zh-cn&item_id=${data.avatar_id}&tab_from=TabOwned&change_target_level=0&uid=${this.uid}&region=${this.server}`
        },
        detail_equip: {
          url: `${host}event/rpgcalc/equipment/list`,
          query: `game=hkrpg&lang=zh-cn&tab_from=TabAll&page=1&size=999&uid=${this.uid}&region=${this.server}`
        },
        detail_avatar: {
          url: `${host}event/rpgcalc/avatar/list`,
          query: `game=hkrpg&lang=zh-cn&tab_from=TabAll&page=1&size=999&uid=${this.uid}&region=${this.server}`
        },
        rogue: {
          url: `${hostRecord}game_record/app/hkrpg/api/rogue`,
          query: `need_detail=true&role_id=${this.uid}&schedule_type=3&server=${this.server}`
        },
        deviceLogin: {
          url: `${Bbs_api}apihub/api/deviceLogin`,
          body: {
            app_version: '2.73.1',
            device_id: data.deviceId,
            device_name: `${deviceBrand}${modelName}`,
            os_version: '33',
            platform: 'Android',
            registration_id: this.generateSeed(19)
          }
        },
        saveDevice: {
          url: `${Bbs_api}apihub/api/saveDevice`,
          body: {
            app_version: '2.73.1',
            device_id: data.deviceId,
            device_name: `${deviceBrand}${modelName}`,
            os_version: '33',
            platform: 'Android',
            registration_id: this.generateSeed(19)
          }
        }
      },
      zzz: {
        ...(['prod_gf_cn'].includes(this.server) ? {
          sign: {
            url: `${host_nap}event/luna/zzz/sign`,// 国服绝区零签到
            body: { act_id: 'e202406242138391', region: this.server, uid: this.uid, lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host_nap}event/luna/zzz/info`,
            query: `lang=zh-cn&act_id=e202406242138391&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${host_nap}event/luna/zzz/home`,
            query: 'lang=zh-cn&act_id=e202406242138391',
            types: 'sign'
          }
        } : {
          sign: {
            url: `${host_nap}event/luna/zzz/os/sign`,// 国际服绝区零签到
            body: { act_id: 'e202406031448091', lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host_nap}event/luna/zzz/os/info`,
            query: 'lang=zh-cn&act_id=e202406031448091',
            types: 'sign'
          },
          sign_home: {
            url: `${host_nap}event/luna/zzz/os/home`,
            query: 'lang=zh-cn&act_id=e202406031448091',
            types: 'sign'
          }
        })
      },
      bh3: {
        bh3_cn: {
          url: 'https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie',
          query: 'game_biz=bh3_cn'
        },
        bh3_global: {
          url: 'https://sg-public-api.hoyolab.com/binding/api/getUserGameRolesByCookie',
          query: 'game_biz=bh3_global'
        },
        ...(['bh3_cn'].includes(this.biz) ? {
          sign: {
            url: `${host}event/luna/bh3/sign`,// 国服崩三签到
            body: { act_id: 'e202306201626331', region: this.server, uid: this.uid, lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/luna/bh3/info`,
            query: `lang=zh-cn&act_id=e202306201626331&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/luna/bh3/home`,
            query: 'lang=zh-cn&act_id=e202306201626331',
            types: 'sign'
          }
        } : {
          sign: {
            url: `${host}event/mani/sign`,// 国际服崩三签到
            body: { act_id: 'e202110291205111', lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/mani/info`,
            query: 'lang=zh-cn&act_id=e202110291205111',
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/mani/home`,
            query: 'lang=zh-cn&act_id=e202110291205111',
            types: 'sign'
          }
        })
      },
      bh2: {
        bh2_cn: {
          url: 'https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie',
          query: 'game_biz=bh2_cn'
        },
        sign: {
          url: `${host}event/luna/sign`,// 国服崩二签到
          body: { act_id: 'e202203291431091', region: this.server, uid: this.uid, lang: 'zh-cn' },
          types: 'sign'
        },
        sign_info: {
          url: `${host}event/luna/info`,
          query: `lang=zh-cn&act_id=e202203291431091&region=${this.server}&uid=${this.uid}`,
          types: 'sign'
        },
        sign_home: {
          url: `${host}event/luna/home`,
          query: 'lang=zh-cn&act_id=e202203291431091',
          types: 'sign'
        }
      },
      wd: {
        ...(['cn_prod_gf01', 'cn_prod_bb01', 'cn_prod_mix01'].includes(this.server) ? {
          sign: {
            url: `${host}event/luna/sign`,// 国服未定签到
            body: { act_id: 'e202202251749321', region: this.server, uid: this.uid, lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/luna/info`,
            query: `lang=zh-cn&act_id=e202202251749321&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/luna/home`,
            query: 'lang=zh-cn&act_id=e202202251749321',
            types: 'sign'
          }
        } : {
          sign: {
            url: `${host}event/luna/os/sign`,// 国际服未定签到
            body: ['tw_prod_wd01'].includes(this.server) ? { act_id: 'e202308141137581', lang: 'zh-tw' } : { act_id: 'e202202281857121', lang: 'zh-cn' },
            types: 'sign'
          },
          sign_info: {
            url: `${host}event/luna/os/info`,
            query: ['tw_prod_wd01'].includes(this.server) ? 'lang=zh-tw&act_id=e202308141137581' : 'lang=zh-cn&act_id=e202202281857121',
            types: 'sign'
          },
          sign_home: {
            url: `${host}event/luna/os/home`,
            query: ['tw_prod_wd01'].includes(this.server) ? 'lang=zh-tw&act_id=e202308141137581' : 'lang=zh-cn&act_id=e202202281857121',
            types: 'sign'
          }
        })
      }
    }
    return urlMap[this.game]
  }

  generateSeed(length = 16) {
    const characters = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters[Math.floor(Math.random() * characters.length)]
    }
    return result
  }
}
