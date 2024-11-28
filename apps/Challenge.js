import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';

export class Challenge extends plugin {
    constructor() {
        super({
            name: "鸣潮-挑战数据",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)(?:挑战|挑战数据|全息战略)(\\d{9})?$",
                    fnc: "challenge"
                }
            ]
        })
    }

    async challenge(e) {

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

            const [baseData, challengeData] = await Promise.all([
                waves.getBaseData(account.serverId, account.roleId, account.token),
                waves.getChallengeData(account.serverId, account.roleId, account.token)
            ]);

            if (!baseData.status || !challengeData.status) {
                data.push({ message: baseData.msg || challengeData.msg });
            } else {
                const result = [];

                Object.keys(challengeData.data.challengeInfo).forEach(key => {
                    const challenges = challengeData.data.challengeInfo[key];

                    for (let i = challenges.length - 1; i >= 0; i--) {
                        if (challenges[i].roles) {
                            result.push(challenges[i]);
                            break;
                        }
                    }
                });

                for (let i = 0; i < result.length; i++) {
                    const passTime = result[i].passTime;
                    const hours = Math.floor(passTime / 3600);
                    const minutes = Math.floor((passTime % 3600) / 60);
                    const seconds = passTime % 60;
                    result[i].passTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                };

                const imageCard = await Render.render('Template/challengeDetails/challengeDetails', {
                    isSelf: !!(!roleId && await redis.get(`Yunzai:waves:users:${e.user_id}`)),
                    baseData: baseData.data,
                    challengeData: result,
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

        await e.reply(Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }
}