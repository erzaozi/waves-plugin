import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';

export class Calabash extends plugin {
    constructor() {
        super({
            name: "鸣潮-数据坞",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)(?:数据坞|声骸)(\\d{9})?$",
                    fnc: "calabash"
                }
            ]
        })
    }

    async calabash(e) {

        if (e.at) e.user_id = e.at;
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);
        const waves = new Waves();

        const [, roleId] = e.msg.match(this.rule[0].reg);

        if (!accountList.length) {
            if (roleId || await redis.get(`Yunzai:waves:bind:${e.user_id}`)) {
                let publicCookie = await waves.pubCookie();
                if (!publicCookie) {
                    return await e.reply('当前没有可用的公共Cookie，请使用[~登录]进行登录');
                } else {
                    if (roleId) {
                        publicCookie.roleId = roleId;
                        await redis.set(`Yunzai:waves:bind:${e.user_id}`, publicCookie.roleId);
                    } else if (await redis.get(`Yunzai:waves:bind:${e.user_id}`)) {
                        publicCookie.roleId = await redis.get(`Yunzai:waves:bind:${e.user_id}`);
                    }
                    accountList.push(publicCookie);
                }
            } else {
                return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
            }
        }

        let data = [];
        let deleteroleId = [];

        await Promise.all(accountList.map(async (account) => {
            const usability = await waves.isAvailable(account.serverId, account.roleId, account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                return;
            }

            if (roleId) {
                account.roleId = roleId;
                await redis.set(`Yunzai:waves:bind:${e.user_id}`, account.roleId);
            }

            const [baseData, calabashData] = await Promise.all([
                waves.getBaseData(account.serverId, account.roleId, account.token),
                waves.getCalabashData(account.serverId, account.roleId, account.token)
            ]);

            if (!baseData.status || !calabashData.status) {
                data.push({ message: baseData.msg || calabashData.msg });
            } else {
                if (!calabashData.data.phantomList) {
                    calabashData.data.phantomList = []
                };
                calabashData.data.phantomList.sort((a, b) => {
                    return b.star - a.star
                });

                const imageCard = await Render.render('Template/calaBash/calaBash', {
                    isSelf: !!(!roleId && await redis.get(`Yunzai:waves:users:${e.user_id}`)),
                    baseData: baseData.data,
                    calabashData: calabashData.data,
                }, { e, retType: 'base64' });

                data.push({ message: imageCard });
            }
        }));

        if (deleteroleId.length) {
            const newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserData(e.user_id, newAccountList);
        }

        if (data.length === 1) {
            await e.reply(data[0].message);
            return true;
        }

        await e.reply(await Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }
}