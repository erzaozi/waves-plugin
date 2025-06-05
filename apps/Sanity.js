import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';
import pLimit from 'p-limit';

export class Sanity extends plugin {
    constructor() {
        super({
            name: "鸣潮-日常数据",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(波片|体力|日常数据)$",
                    fnc: "sanity"
                }
            ]
        })
        this.task = {
            name: '[Waves-Plugin] 波片推送',
            fnc: () => this.autoPush(),
            cron: Config.getConfig().sanity_push_time,
            log: false
        }
    }

    async sanity(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        const waves = new Waves();
        let data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await waves.isAvailable(account.serverId, account.roleId, account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            const gameData = await waves.getGameData(account.token);

            if (!gameData.status) {
                data.push({ message: gameData.msg });
            } else {
                const imageCard = await Render.render('Template/dailyData/dailyData', {
                    isSelf: true,
                    gameData: gameData.data,
                }, { e, retType: 'base64' });

                data.push({ message: imageCard });
            }
        }

        if (deleteroleId.length) {
            let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserData(e.user_id, newAccountList);
        }

        if (data.length === 1) {
            await e.reply(data[0].message);
            return true;
        }

        await e.reply(await Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }

    async autoPush() {
        const { waves_auto_push_list: autoPushList } = Config.getUserConfig();
        const limit = pLimit(Config.getConfig().limit);
        await Promise.all(autoPushList.map(user =>
            limit(async () => {
                const { botId, groupId, userId } = user;
                let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${userId}`)) || await Config.getUserData(userId);
                if (!accountList.length) {
                    return
                }

                const waves = new Waves();
                let data = [];
                let deleteroleId = [];

                for (let account of accountList) {
                    const usability = await waves.isAvailable(account.serverId, account.roleId, account.token);

                    if (!usability) {
                        data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                        deleteroleId.push(account.roleId);
                        continue;
                    }

                    const result = await waves.getGameData(account.token);

                    if (!result.status) {
                        data.push({ message: result.msg })
                        return true;
                    }

                    const key = `Yunzai:waves:pushed:${result.data.roleId}`;
                    const isPushed = await redis.get(key);
                    const threshold = await redis.get(`Yunzai:waves:sanity_threshold:${userId}`) || result.data.energyData.total;
                    const isFull = result.data.energyData.cur >= threshold;
                    if (isFull && !isPushed) {
                        data.push({ message: `漂泊者${result.data.roleName}(${result.data.roleId})，你的结晶波片已经恢复至 ${threshold} 了哦~` })
                        await redis.set(key, 'true');
                    } else if (!isFull && isPushed) {
                        await redis.del(key);
                    }
                }

                if (deleteroleId.length) {
                    let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
                    Config.setUserData(userId, newAccountList);
                }

                if (data.length) {
                    if (data.length === 1) {
                        if (!groupId) {
                            await Bot[botId]?.pickUser(userId).sendMsg(data[0].message)
                        } else {
                            await Bot[botId]?.pickGroup(groupId).sendMsg([segment.at(userId), data[0].message])
                        }
                        return true;
                    }
                    else if (!groupId) {
                        await Bot[botId]?.pickUser(userId).sendMsg(await Bot.makeForwardMsg([{ message: `用户 ${userId}` }, ...data]))
                    }
                    else {
                        await Bot[botId]?.pickGroup(groupId).sendMsg(segment.at(userId))
                        await Bot[botId]?.pickGroup(groupId).sendMsg(await Bot.makeForwardMsg([{ message: `用户 ${userId}` }, ...data]))
                    }
                }
                return true;
            })
        ));
    }
}