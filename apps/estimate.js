/* 原石预估来自米游社@要和我一起去炸鱼吗m */
/* 星琼预估来自米游社@乌鸦Rabble */
import fetch from 'node-fetch'
import common from '../../../lib/common/common.js'

export class ji_estimate extends plugin {
  constructor(e) {
    super({
      name: '寄·预估',
      dsc: '',
      event: 'message',
      priority: -114514,
      rule: [
        {
          reg: '^#?(原神|星铁)?(原石|星琼)?预估$',
          fnc: 'estimate'
        }
      ]
    })
    this.e = e
  }

  async estimate(e) {
    let res
    const isSr = /星铁|星琼/.test(this.e.msg)
    if (isSr) {
      res = await (await fetch("https://bbs-api.miyoushe.com/painter/api/user_instant/search/list?keyword=%E5%8F%AF%E8%8E%B7%E5%8F%96%E6%98%9F%E7%90%BC&uid=73779489&size=20&offset=0&sort_type=2")).json()
    } else {
      res = await (await fetch("https://bbs-api.miyoushe.com/painter/api/user_instant/search/list?keyword=%E5%8F%AF%E8%8E%B7%E5%8F%96%E5%8E%9F%E7%9F%B3&uid=288721427&size=20&offset=0&sort_type=2")).json()
    }
    const post = res.data.list[0].post.post

    let promises = []
    for (let images of post.images)
      promises.push(segment.image(images))

    await Promise.all(promises)

    await e.reply(await common.makeForwardMsg(e, [[post.subject], promises]))
  }
}