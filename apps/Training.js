import plugin from '../../../lib/plugins/plugin.js'
import WeightCalculator from '../utils/Calculate.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';

export class Training extends plugin {
    constructor() {
        super({
            name: "鸣潮-练度统计",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)(?:练度|练度统计)(\\d{9})?$",
                    fnc: "training"
                }
            ]
        })
    }

    async training(e) {

        if (e.at) e.user_id = e.at;
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);
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

            const [baseData, roleData] = await Promise.all([
                waves.getBaseData(account.serverId, account.roleId, account.token),
                waves.getRoleData(account.serverId, account.roleId, account.token)
            ]);

            if (!baseData.status || !roleData.status) {
                data.push({ message: baseData.msg || roleData.msg });
                return;
            }

            const Promises = roleData.data.roleList.map(role =>
                waves.getRoleDetail(account.serverId, account.roleId, role.roleId, account.token).then(data =>
                    data.status && data.data.role ? { ...role, ...data.data } : null
                )
            );

            const roleList = (await Promise.all(Promises)).filter(Boolean).map(role => {
                const calculatedRole = new WeightCalculator(role).calculate();
                calculatedRole.chainCount = calculatedRole.chainList.filter(chain => chain.unlocked).length;
                return calculatedRole;
            });

            roleList.sort((a, b) => b.starLevel - a.starLevel || b.phantomData.statistic.totalScore - a.phantomData.statistic.totalScore);

            const imageCard = await Render.render('Template/training/training', {
                baseData: baseData.data,
                roleList,
            }, { e, retType: 'base64' });

            data.push({ message: imageCard });
        }));

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