import plugin from "../../../lib/plugins/plugin.js"

export class Setting extends plugin {
    constructor() {
        super({
            name: "鸣潮-用户设置",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)设置",
                    fnc: "set"
                },
            ]
        })
    }

    async set(e) {
    }
}
