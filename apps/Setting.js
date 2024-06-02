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
                    reg: "^(～|~|鸣潮)(开启|关闭)自动签到$",
                    fnc: "setAutoSign"
                },
                {
                    reg: "^(～|~|鸣潮)(开启|关闭)(波片|体力)?推送$",
                    fnc: "setAutoPush"
                },
                {
                    reg: "^(～|~|鸣潮)(开启|关闭)(公告|新闻|活动)推送$",
                    fnc: "setAutoNews"
                }
            ]
        })
    }

    async setAutoSign(e) {
        const accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);
        if (!accountList.length) return e.reply("你还没有绑定任何账号呢，请使用[~登录]进行绑定");

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
        if (!accountList.length) return e.reply("你还没有绑定任何账号呢，请使用[~登录]进行绑定");

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

    async setAutoNews(e) {
        let key;

        if (e.isGroup) {
            if (!e.group.is_admin && !e.group.is_owner) {
                await e.reply("只有管理员才能开启群推送");
                return true
            }
            key = `${e.self_id}:${e.group_id}:undefined`;
        } else {
            key = `${e.self_id}:undefined:${e.user_id}`;
        }

        const config = await Config.getConfig();
        const index = config.waves_auto_news_list.indexOf(key);

        if (e.msg.includes('开启')) {
            if (index === -1) {
                config.waves_auto_news_list.push(key);
                Config.setConfig(config);
                return e.reply("已开启活动推送");
            }
            return e.reply("你已经开启了活动推送");
        }

        if (index !== -1) {
            config.waves_auto_news_list.splice(index, 1);
            Config.setConfig(config);
            return e.reply("已关闭活动推送");
        }
        return e.reply("你已经关闭了活动推送");
    }
}