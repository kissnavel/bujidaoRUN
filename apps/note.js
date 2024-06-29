import plugin from '../../../lib/plugins/plugin.js'
import Note from '../model/note.js'
import _ from 'lodash'

export class ji_note extends plugin {
    constructor() {
        super({
            name: '寄·体力',
            dsc: '',
            event: 'message',
            priority: -114514,
            rule: [
                {
                    reg: '^#?(多|全|全部|原神|星铁)?(体力|开拓力|树脂|查询体力|便笺|便签)$',
                    fnc: 'note'
                }
            ]
        })
    }

    async note() {
        await Note.get(this.e)
    }
}