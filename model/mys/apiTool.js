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
      hostRecord: 'https://api-takumi-record.mihoyo.com/'
    }

    let urlMap = {
      all: {
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
          url: `${hostList.hostRecord}game_record/app/genshin/api/dailyNote`,
          query: `role_id=${this.uid}&server=${this.server}`
        },
        widget: {
          url: `${hostList.hostRecord}game_record/genshin/aapi/widget/v2`,
          types: 'widget'
        },
        sign: {
          url: `${hostList.host}event/luna/sign`,
          body: { lang: 'zh-cn', act_id: 'e202311201442471', region: this.server, uid: this.uid },
          types: 'sign_gs'
        },
        sign_info: {
          url: `${hostList.host}event/luna/info`,
          query: `lang=zh-cn&act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
          types: 'sign_gs'
        },
        sign_home: {
          url: `${hostList.host}event/luna/home`,
          query: `lang=zh-cn&act_id=e202311201442471&region=${this.server}&uid=${this.uid}`,
          types: 'sign_gs'
        }
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

    return urlMap[this.game]
  }
}