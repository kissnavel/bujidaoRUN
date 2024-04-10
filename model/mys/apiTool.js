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
      bbs_api: 'https://bbs-api.mihoyo.com/',
    }
    let hostRecord
    if (['cn_gf01', 'cn_qd01', 'prod_gf_cn', 'prod_qd_cn'].includes(this.server)) {
      hostRecord = 'https://api-takumi-record.mihoyo.com/'
    } else if (['os_usa', 'os_euro', 'os_asia', 'os_cht'].includes(this.server)) {
      hostRecord = 'https://bbs-api-os.mihoyo.com/'
    }

    let urlMap = {
      all: {
        createVerification: {
          url: `${hostRecord}game_record/app/card/wapi/createVerification`,
          query: 'is_high=true'
        },
        verifyVerification: {
          url: `${hostRecord}game_record/app/card/wapi/verifyVerification`,
          body: {
            "geetest_challenge": data.challenge,
            "geetest_validate": data.validate,
            "geetest_seccode": `${data.validate}|jordan`
          }
        },
        validate: {
          url: `http://api.rrocr.com/api/recognize.html`,
          query: `appkey=${this.api.apikey}&gt=${data.gt}&challenge=${data.challenge}&referer=https://webstatic.mihoyo.com&ip=&host=`
        }
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
        },
      },
      gs: {
        dailyNote: {
          url: `${hostRecord}game_record/app/genshin/api/dailyNote`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        widget: {
          url: `${hostRecord}game_record/genshin/aapi/widget/v2`,
          types: 'widget'
        },
        sign: {
          url: `${hostList.host}event/luna/sign`,
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
      },
      sr: {
        dailyNote: {
          url: `${hostRecord}game_record/app/hkrpg/api/note`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        widget: {
          url: `${hostRecord}game_record/app/hkrpg/aapi/widget`,
          types: 'widget'
        },
        sign: {
          url: `${hostList.host}event/luna/sign`,
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
        },
        index: {
          url: `${hostRecord}game_record/app/hkrpg/api/index`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        UserGame: {
          url: `${hostList.host}common/badge/v1/login/account`,
          body: { uid: this.uid, region: this.server, lang: 'zh-cn', game_biz: 'hkrpg_cn' }
        },
        spiralAbyss: {
          url: `${hostRecord}game_record/app/hkrpg/api/challenge`,
          query: `isPrev=true&need_all=true&role_id=${this.uid}&schedule_type=${data.schedule_type}&server=${this.server}`
        },
        character: {
          url: `${hostRecord}game_record/app/hkrpg/api/avatar/info`,
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
          url: `${hostRecord}game_record/app/hkrpg/api/rogue`,
          query: `need_detail=true&role_id=${this.uid}&schedule_type=3&server=${this.server}`
        },
      },
      bh3: {
        userGameInfo: {
          url: `${hostList.host}binding/api/getUserGameRolesByCookie`,
          query: `game_biz=bh3_cn`,
          types: 'sign'
        },
        sign: {
          url: `${hostList.host}event/luna/sign`,
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
      }
    }

    if (this.server.startsWith('os')) {
      urlMap.gs.sign.url = 'https://sg-hk4e-api.hoyolab.com/event/sol/sign'
      urlMap.gs.sign.body = { lang: 'zh-cn', act_id: 'e202102251931481', region: this.server, uid: this.uid }
      urlMap.gs.sign.types = 'sign'
      urlMap.gs.sign_info.url = 'https://sg-hk4e-api.hoyolab.com/event/sol/info'
      urlMap.gs.sign_info.query = `lang=zh-cn&act_id=e202102251931481&region=${this.server}&uid=${this.uid}`
      urlMap.gs.sign_info.types = 'sign'
      urlMap.gs.sign_home.url = 'https://sg-hk4e-api.hoyolab.com/event/sol/home'
      urlMap.gs.sign_home.query = `lang=zh-cn&act_id=e202102251931481&region=${this.server}&uid=${this.uid}`
      urlMap.gs.sign_home.types = 'sign'
    }

    if (this.game == 'sr'&&this.server.includes('official')) {
      urlMap.sr.sign.url = 'https://sg-public-api.hoyolab.com/event/luna/os/sign'
      urlMap.sr.sign.body = { lang: 'zh-cn', act_id: 'e202303301540311', region: this.server, uid: this.uid }
      urlMap.sr.sign.types = 'sign'
      urlMap.sr.sign_info.url = 'https://sg-public-api.hoyolab.com/event/luna/os/info'
      urlMap.sr.sign_info.query = `lang=zh-cn&act_id=e202303301540311&region=${this.server}&uid=${this.uid}`
      urlMap.sr.sign_info.types = 'sign'
      urlMap.sr.sign_home.url = 'https://sg-public-api.hoyolab.com/event/luna/os/home'
      urlMap.sr.sign_home.query = `lang=zh-cn&act_id=e202303301540311&region=${this.server}&uid=${this.uid}`
      urlMap.sr.sign_home.types = 'sign'
    }

    if (this.game === 'bh3'&&this.server.includes('official')) {
      urlMap.bh3.userGameInfo.url = 'https://sg-public-api.hoyolab.com/binding/api/getUserGameRolesByCookie'
      urlMap.bh3.userGameInfo.query = `game_biz=bh3_global`
      urlMap.bh3.userGameInfo.types = 'sign'
      urlMap.bh3.sign.url = 'https://sg-public-api.hoyolab.com/event/mani/sign'
      urlMap.bh3.sign.body = { lang: 'zh-cn', act_id: 'e202110291205111', region: this.server, uid: this.uid }
      urlMap.bh3.sign.types = 'sign'
      urlMap.bh3.sign_info.url = 'https://sg-public-api.hoyolab.com/event/mani/info'
      urlMap.bh3.sign_info.query = `lang=zh-cn&act_id=e202110291205111&region=${this.server}&uid=${this.uid}`
      urlMap.bh3.sign_info.types = 'sign'
      urlMap.bh3.sign_home.url = 'https://sg-public-api.hoyolab.com/event/mani/home'
      urlMap.bh3.sign_home.query = `lang=zh-cn&act_id=e202110291205111&region=${this.server}&uid=${this.uid}`
      urlMap.bh3.sign_home.types = 'sign'
    }
    return urlMap[this.game]
  }
}