import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";

export class UserInfo extends plugin {
    constructor() {
        super({
            name: "鸣潮-用户信息",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)信息$",
                    fnc: "userInfo"
                }
            ]
        })
    }

    async userInfo(e) {
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

            const baseData = await waves.getBaseData(account.serverId, account.roleId, account.token);
            const roleData = await waves.getRoleData(account.serverId, account.roleId, account.token);

            // 渲染卡片

            data.push({ message: result });
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