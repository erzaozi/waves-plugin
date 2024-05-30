import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../model/render.js'

export class Explore extends plugin {
    constructor() {
        super({
            name: "鸣潮-探索数据",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)(探索度|地图).*$",
                    fnc: "explore"
                }
            ]
        })
    }

    async explore(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);

        if (!accountList.length) {
            return await e.reply('当前没有绑定任何账号，请使用[#鸣潮登录]进行绑定');
        }

        const waves = new Waves();
        let data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await waves.isAvailable(account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新绑定Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            if (e.msg.replace(/^#?(waves|鸣潮)(探索度|地图)/, '').match(/^\d{9}$/)) {
                account.roleId = e.msg.replace(/^#?(waves|鸣潮)(探索度|地图)/, '');
            }

            const baseData = await waves.getBaseData(account.serverId, account.roleId, account.token);
            const exploreData = await waves.getExploreData(account.serverId, account.roleId, account.token);

            if (!baseData.status || !exploreData.status) {
                data.push({ message: baseData.msg || exploreData.msg });
            } else {
                const imageCard = await Render.exploreData(baseData.data, exploreData.data)
                data.push({ message: imageCard });
            }
        }

        if (deleteroleId.length) {
            let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserConfig(e.user_id, newAccountList);
        }

        if (data.length === 1) {
            await e.reply(data[0].message);
            return true;
        }

        await e.reply(Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }
}