import plugin from "../../../lib/plugins/plugin.js"
import Config from "../components/Config.js"

export class Setting extends plugin {
    constructor() {
        super({
            name: "鸣潮-用户设置",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)(开启|关闭)自动签到$",
                    fnc: "setAutoSign"
                },
                {
                    reg: "^#?(waves|鸣潮)(开启|关闭)(波片|体力)?推送$",
                    fnc: "setAutoPush"
                },
            ]
        })
    }

    async setAutoSign(e) {
        const accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);
        if (!accountList.length) return e.reply("你还没有绑定任何账号呢，请使用[#鸣潮登录]进行绑定");

        const config = await Config.getConfig();
        const key = `${e.self_id}:${e.group_id}:${e.user_id}`;
        const index = config["waves_auto_signin_list"].indexOf(key);

        if (e.msg.includes('开启')) {
            if (index === -1) {
                config["waves_auto_signin_list"].push(key);
                Config.setConfig(config);
                return e.reply("已开启自动签到");
            }
            return e.reply("你已经开启了自动签到");
        }

        if (index !== -1) {
            config["waves_auto_signin_list"].splice(index, 1);
            Config.setConfig(config);
            return e.reply("已关闭自动签到");
        }
        return e.reply("你已经关闭了自动签到");
    }

    async setAutoPush(e) {
        const accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);
        if (!accountList.length) return e.reply("你还没有绑定任何账号呢，请使用[#鸣潮登录]进行绑定");

        const config = await Config.getConfig();
        const key = `${e.self_id}:${e.group_id}:${e.user_id}`;
        const index = config["waves_auto_push_list"].indexOf(key);

        if (e.msg.includes('开启')) {
            if (index === -1) {
                config["waves_auto_push_list"].push(key);
                Config.setConfig(config);
                return e.reply("已开启结晶波片推送");
            }
            return e.reply("你已经开启了结晶波片推送");
        }

        if (index !== -1) {
            config["waves_auto_push_list"].splice(index, 1);
            Config.setConfig(config);
            return e.reply("已关闭结晶波片推送");
        }
        return e.reply("你已经关闭了结晶波片推送");
    }
}