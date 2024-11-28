import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';

export class TowerInfo extends plugin {
    constructor() {
        super({
            name: "鸣潮-逆境深塔",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)(?:逆境)?(?:深(?:塔|渊)|(稳定|实验|超载|深境)(?:区)?)(\\d{9})?$",
                    fnc: "tower"
                }
            ]
        })
    }

    async tower(e) {

        if (e.at) e.user_id = e.at;
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);
        const waves = new Waves();

        let [, key, roleId] = e.msg.match(this.rule[0].reg)

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
            const usability = await waves.isAvailable(account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                return;
            }

            if (roleId) {
                account.roleId = roleId;
                await redis.set(`Yunzai:waves:bind:${e.user_id}`, account.roleId);
            }

            const [baseData, towerData] = await Promise.all([
                waves.getBaseData(account.serverId, account.roleId, account.token),
                waves.getTowerData(account.serverId, account.roleId, account.token)
            ]);

            if (!baseData.status || !towerData.status) {
                data.push({ message: baseData.msg || towerData.msg });
            } else {
                const Mapping = { '稳定': 1, '实验': 2, '深境': 3, '超载': 4 };
                if (!key) key = '深境';
                if (!towerData.data.difficultyList.some(item => item.difficulty === Mapping[key] && item.towerAreaList.length > 0)) {
                    data.push({ message: `账号 ${account.roleId} 没有${key}区数据` });
                    return;
                }
                towerData.data = { ...towerData.data, difficulty: Mapping[key] || 3, diffiname: `${key}区` };
                const imageCard = await Render.render('Template/towerData/tower', {
                    isSelf: !!(!roleId && await redis.get(`Yunzai:waves:users:${e.user_id}`)),
                    baseData: baseData.data,
                    towerData: towerData.data,
                }, { e, retType: 'base64' });

                data.push({ message: imageCard });
            }
        }));

        if (deleteroleId.length) {
            let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserData(e.user_id, newAccountList);
        }

        if (data.length === 1) {
            await e.reply(data[0].message);
            return true;
        }

        await e.reply(Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }
}