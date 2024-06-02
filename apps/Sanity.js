import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../model/render.js'

export class Sanity extends plugin {
    constructor() {
        super({
            name: "鸣潮-日常数据",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(波片|体力|日常数据)$",
                    fnc: "querySanity"
                }
            ]
        })
        this.task = {
            name: '[Waves-Plugin] 波片推送',
            fnc: () => this.autoPush(),
            cron: '*/7 * * * *',
            log: false
        }
    }

    async querySanity(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有绑定任何账号，请使用[~登录]进行绑定');
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

            const gameData = await waves.getGameData(account.token);

            if (!gameData.status) {
                data.push({ message: gameData.msg });
            } else {
                const imageCard = await Render.dailyData(gameData.data)
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

    async autoPush() {
        const { waves_auto_push_list: autoPushList } = Config.getConfig();
        await Promise.all(autoPushList.map(async user => {
            const [botId, groupId, userId] = user.split(':');
            let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${userId}`)) || await Config.getUserConfig(userId);
            if (!accountList.length) {
                return
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

                const result = await waves.getGameData(account.token);

                if (!result.status) {
                    data.push({ message: result.msg })
                    return true;
                }

                const key = `Yunzai:waves:pushed:${result.data.roleId}`;
                const isPushed = await redis.get(key);
                let isFull = false
                if (result.data.energyData.refreshTimeStamp === 0 || (result.data.energyData.refreshTimeStamp * 1000) < new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))) {
                    isFull = true
                }
                if (isFull && !isPushed) {
                    data.push({ message: `漂泊者${result.data.roleName}(${result.data.roleId})，你的结晶波片已经恢复满了哦~` })
                    await redis.set(key, 'true');
                } else if (!isFull && isPushed) {
                    await redis.del(key);
                }
            }

            if (deleteroleId.length) {
                let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
                Config.setUserConfig(e.user_id, newAccountList);
            }

            if (data.length) {
                if (data.length === 1) {
                    if (groupId === "undefined") {
                        await Bot[botId]?.pickUser(userId).sendMsg(data[0].message)
                    } else {
                        await Bot[botId]?.pickGroup(groupId).sendMsg([segment.at(userId), data[0].message])
                    }
                    return true;
                } else {
                    if (groupId === "undefined") {
                        await Bot[botId]?.pickUser(userId).sendMsg(Bot.makeForwardMsg([{ message: `用户 ${userId}` }, ...data]))
                    } else {
                        await Bot[botId]?.pickGroup(groupId).sendMsg(segment.at(userId))
                        await Bot[botId]?.pickGroup(groupId).sendMsg(Bot.makeForwardMsg([{ message: `用户 ${userId}` }, ...data]))
                    }
                }
            }
            return true;
        }))
    }
}