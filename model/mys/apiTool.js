import Cfg from '../Cfg.js'

export default class apiTool {
  constructor(uid, server, game = 'gs') {
    this.uid = uid
    this.server = server
    this.game = game
    this.api = Cfg.getConfig('api')
  }

  getUrlMap = (data = {}) => {
    let hostList = {
      host: 'https://api-takumi.mihoyo.com/',
      host_os: 'https://sg-public-api.hoyolab.com/',
      host_os_hk4e: 'https://sg-hk4e-api.hoyolab.com/',      
      bbs_api: 'https://bbs-api.mihoyo.com/',
      hostRecord: 'https://api-takumi-record.mihoyo.com/',
      hostRecord_os: 'https://bbs-api-os.hoyolab.com/'
    }

    let urlMap = {// 细分签到
      all: {
        ...(['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn'].includes(this.server) ? {
          createVerification: {
            url: `${hostList.hostRecord}game_record/app/card/wapi/createVerification`,
            query: 'is_high=true'
          },
          verifyVerification: {
            url: `${hostList.hostRecord}game_record/app/card/wapi/verifyVerification`,
            body: {
              "geetest_challenge": data.challenge,
              "geetest_validate": data.validate,
              "geetest_seccode": `${data.validate}|jordan`
            }
          },
          validate: {
            url: `http://api.rrocr.com/api/recognize.html`,// 国服过码
            query: `appkey=${this.api.apikey}&gt=${data.gt}&challenge=${data.challenge}&referer=https://webstatic.mihoyo.com&ip=&host=`
          }
        } : {
          createVerification: {
            url: `${hostList.hostRecord_os}game_record/app/card/wapi/createVerification`,
            query: 'is_high=true'
          },
          verifyVerification: {
            url: `${hostList.hostRecord_os}game_record/app/card/wapi/verifyVerification`,
            body: {
              "geetest_challenge": data.challenge,
              "geetest_validate": data.validate,
              "geetest_seccode": `${data.validate}|jordan`
            }
          },
          validate: {
            url: `http://api.rrocr.com/api/recognize.html`,// 国际服过码，暂时保留，未触发验证未测试
            query: `appkey=${this.api.apikey}&gt=${data.gt}&challenge=${data.challenge}&referer=https://webstatic-sea.hoyolab.com&ip=&host=`
          }
        })
      },
      bbs: {
        bbsisSign: {
          url: `${hostList.bbs_api}apihub/sapi/getUserMissionsState`,
          types: 'bbs'
        },
        bbsSign: {
          url: `${hostList.bbs_api}apihub/app/api/signIn`,
          body: {
            gids: data.signId
          },
          sign: true,
          types: 'bbs'
        },
        bbsGetCaptcha: {
          url: `${hostList.bbs_api}misc/api/createVerification`,
          query: `is_high=false`,
          types: 'bbs'
        },
        bbsCaptchaVerify: {
          url: `${hostList.bbs_api}misc/api/verifyVerification`,
          body: {
            "geetest_challenge": data.challenge,
            "geetest_validate": data.validate,
            "geetest_seccode": `${data.validate}|jordan`
          },
          types: 'bbs'
        },
        bbsPostList: {
          url: `${hostList.bbs_api}post/api/getForumPostList`,
          query: `forum_id=${data.forumId}&is_good=false&is_hot=false&page_size=20&sort_type=1`,
          types: 'bbs'
        },
        bbsPostFull: {
          url: `${hostList.bbs_api}post/api/getPostFull`,
          query: `post_id=${data.postId}`,
          types: 'bbs'
        },
        bbsReply: {
          url: `${hostList.bbs_api}post/api/releaseReply`,
          body: {
            "content": data.Replymsg,
            "post_id": data.postId,
            "reply_id": "",
            "structured_content": data.Replymsg
          },
          types: 'bbs'
        },
        bbsShareConf: {
          url: `${hostList.bbs_api}apihub/api/getShareConf`,
          query: `entity_id=${data.postId}&entity_type=1`,
          types: 'bbs'
        },
        bbsVotePost: {
          url: `${hostList.bbs_api}apihub/sapi/upvotePost`,
          body: {
            "post_id": data.postId,
            "is_cancel": false
          },
          types: 'bbs'
        },
        bbsGetCaptcha: {
          url: `${hostList.bbs_api}misc/api/createVerification`,
          query: `is_high=false`,
          types: 'bbs'
        },
        bbsCaptchaVerify: {
          url: `${hostList.bbs_api}misc/api/verifyVerification`,
          body: {
            "geetest_challenge": data.challenge,
            "geetest_validate": data.validate,
            "geetest_seccode": `${data.validate}|jordan`
          },
          types: 'bbs'
        }
      },
      gs: {
        dailyNote: {
          url: `${hostList.hostRecord}game_record/app/genshin/api/dailyNote`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        widget: {
          url: `${hostList.hostRecord}game_record/genshin/aapi/widget/v2`,
          types: 'widget'
        },
        ...(['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn'].includes(this.server) ? {
          sign: {
            url: `${hostList.host}event/luna/sign`,// 国服原神签到
            body: { lang: 'zh-cn', act_id: 'e202311201442471', region: this.server, uid: this.uid },
            types: 'sign'
          },
          sign_info: {
            url: `${hostList.host}event/luna/info`,
            query: `lang=zh-cn&act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${hostList.host}event/luna/home`,
            query: `lang=zh-cn&act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          }
        } : {
          sign: {
            url: `${hostList.host_os_hk4e}event/sol/sign`,// 国际服原神签到
            body: { lang: 'zh-cn', act_id: 'e202102251931481', region: this.server, uid: this.uid },
            types: 'sign'
          },
          sign_info: {
            url: `${hostList.host_os_hk4e}event/sol/info`,
            query: `lang=zh-cn&act_id=e202102251931481&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${hostList.host_os_hk4e}event/sol/home`,
            query: `lang=zh-cn&act_id=e202102251931481&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          }
        })
      },
      sr: {
        dailyNote: {
          url: `${hostList.hostRecord}game_record/app/hkrpg/api/note`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        widget: {
          url: `${hostList.hostRecord}game_record/app/hkrpg/aapi/widget`,
          types: 'widget'
        },
        index: {
          url: `${hostList.hostRecord}game_record/app/hkrpg/api/index`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        UserGame: {
          url: `${hostList.host}common/badge/v1/login/account`,
          body: { uid: this.uid, region: this.server, lang: 'zh-cn', game_biz: 'hkrpg_cn' }
        },
        spiralAbyss: {
          url: `${hostList.hostRecord}game_record/app/hkrpg/api/challenge`,
          query: `isPrev=true&need_all=true&role_id=${this.uid}&schedule_type=${data.schedule_type}&server=${this.server}`
        },
        character: {
          url: `${hostList.hostRecord}game_record/app/hkrpg/api/avatar/info`,
          query: `need_wiki=true&role_id=${this.uid}&server=${this.server}`
        },
        detail: {
          url: `${hostList.host}event/rpgcalc/avatar/detail`,
          query: `game=hkrpg&lang=zh-cn&item_id=${data.avatar_id}&tab_from=TabOwned&change_target_level=0&uid=${this.uid}&region=${this.server}`
        },
        detail_equip: {
          url: `${hostList.host}event/rpgcalc/equipment/list`,
          query: `game=hkrpg&lang=zh-cn&tab_from=TabAll&page=1&size=999&uid=${this.uid}&region=${this.server}`
        },
        detail_avatar: {
          url: `${hostList.host}event/rpgcalc/avatar/list`,
          query: `game=hkrpg&lang=zh-cn&tab_from=TabAll&page=1&size=999&uid=${this.uid}&region=${this.server}`
        },
        rogue: {
          url: `${hostList.hostRecord}game_record/app/hkrpg/api/rogue`,
          query: `need_detail=true&role_id=${this.uid}&schedule_type=3&server=${this.server}`
        },
        ...(['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn'].includes(this.server) ? {
          sign: {
            url: `${hostList.host}event/luna/sign`,// 国服星铁签到
            body: { lang: 'zh-cn', act_id: 'e202304121516551', region: this.server, uid: this.uid },
            types: 'sign'
          },
          sign_info: {
            url: `${hostList.host}event/luna/info`,
            query: `lang=zh-cn&act_id=e202304121516551&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${hostList.host}event/luna/home`,
            query: `lang=zh-cn&act_id=e202304121516551&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          }
        } : {
          sign: {
            url: `${hostList.host_os}event/luna/os/sign`,// 国际服星铁签到
            body: { lang: 'zh-cn', act_id: 'e202303301540311', region: this.server, uid: this.uid },
            types: 'sign'
          },
          sign_info: {
            url: `${hostList.host_os}event/luna/os/info`,
            query: `lang=zh-cn&act_id=e202303301540311&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${hostList.host_os}event/luna/os/home`,
            query: `lang=zh-cn&act_id=e202303301540311&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          }
        })
      },
      bh3: {
        ...(['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn'].includes(this.server) ? {
          userGameInfo: {
            url: `${hostList.host}binding/api/getUserGameRolesByCookie`,
            query: `game_biz=bh3_cn`,
            types: 'sign'
          },
          sign: {
            url: `${hostList.host}event/luna/sign`,// 国服崩三签到
            body: { lang: 'zh-cn', act_id: 'e202306201626331', region: this.server, uid: this.uid },
            types: 'sign'
          },
          sign_info: {
            url: `${hostList.host}event/luna/info`,
            query: `lang=zh-cn&act_id=e202306201626331&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${hostList.host}event/luna/home`,
            query: `lang=zh-cn&act_id=e202306201626331&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          }
        } : {
          userGameInfo: {
            url: `${hostList.host_os}binding/api/getUserGameRolesByCookie`,
            query: `game_biz=bh3_global`,
            types: 'sign'
          },
          sign: {
            url: `${hostList.host_os}event/mani/sign`,// 国际服崩三签到，暂时保留，无崩三号未测试
            body: { lang: 'zh-cn', act_id: 'e202110291205111', region: this.server, uid: this.uid },
            types: 'sign'
          },
          sign_info: {
            url: `${hostList.host_os}event/mani/info`,
            query: `lang=zh-cn&act_id=e202110291205111&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          },
          sign_home: {
            url: `${hostList.host_os}event/mani/home`,
            query: `lang=zh-cn&act_id=e202110291205111&region=${this.server}&uid=${this.uid}`,
            types: 'sign'
          }
        })
      }
    }
    return urlMap[this.game]
  }
}