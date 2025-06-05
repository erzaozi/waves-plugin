import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';

export class SignIn extends plugin {

    static locked = false;

    constructor() {
        super({
            name: "鸣潮-用户签到",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)签到$",
                    fnc: "signIn"
                },
                {
                    reg: "^(～|~|鸣潮)签到记录$",
                    fnc: "signInList"
                },
                {
                    reg: "^(～|~|鸣潮)全部签到$",
                    fnc: "autoSignIn",
                    permission: 'master'
                }
            ]
        })
        this.task = {
            name: '[Waves-Plugin] 自动签到',
            fnc: () => this.autoSignIn(),
            cron: Config.getConfig().signin_time
        }
    }

    async signIn(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        const waves = new Waves();
        const data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await waves.isAvailable(account.serverId, account.roleId, account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            const [signInData, listData] = await Promise.all([
                waves.signIn(account.serverId, account.roleId, account.userId, account.token),
                waves.queryRecord(account.serverId, account.roleId, account.token)
            ]);

            let message = `账号 ${account.userId} 的签到结果\n\n`;
            message += signInData.status ? `[游戏签到] 签到成功，获得「${listData.data[0].goodsName} × ${listData.data[0].goodsNum}」` : `[游戏签到] 签到失败，原因：${signInData.msg}`;
            message += `\n\n签到已完成，发送[~签到记录]查看近期签到记录`;

            data.push({ message: message });
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

    async signInList(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        const waves = new Waves();
        const data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await waves.isAvailable(account.serverId, account.roleId, account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            const listData = await waves.queryRecord(account.serverId, account.roleId, account.token);

            if (!listData.status) {
                data.push({ message: listData.msg })
            } else {
                listData.data = listData.data.slice(0, 50);
                const imageCard = await Render.render('Template/queryRecord/queryRecord', {
                    listData: listData.data,
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

    async autoSignIn() {
        if (SignIn.locked && (this.e ? await this.e.reply('已有签到任务运行中，请勿重复执行') : false)) return true;
        SignIn.locked = true;

        if (this.e) await this.e.reply('正在执行全部签到，稍后会推送签到结果');

        const { waves_auto_signin_list: autoSignInList } = Config.getUserConfig();
        const { signin_interval: interval } = Config.getConfig();
        let success = 0;
        for (let user of autoSignInList) {
            const { botId, groupId, userId } = user;
            const accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${userId}`)) || await Config.getUserData(userId);
            if (!accountList.length) {
                continue;
            }

            let data = [];
            let deleteroleId = [];

            for (let account of accountList) {
                const waves = new Waves();
                const usability = await waves.isAvailable(account.serverId, account.roleId, account.token);

                if (!usability) {
                    data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                    deleteroleId.push(account.roleId);
                    continue;
                }

                let result = await waves.signIn(account.serverId, account.roleId, account.userId, account.token);

                if (result.status) success++

                await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }

            if (deleteroleId.length) {
                let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
                Config.setUserData(userId, newAccountList);
            }

            if (data.length) Bot[botId]?.pickUser(userId).sendMsg(await Bot.makeForwardMsg(data))
        }

        if (this.e) {
            await this.e.reply(`[Waves-Plugin] 全部签到\n成功签到 ${success} 个账号`);
        } else {
            if (!Bot.sendMasterMsg) {
                const cfg = (await import("../../../lib/config/config.js")).default
                Bot.sendMasterMsg = async m => { for (const i of cfg.masterQQ) await Bot.pickFriend(i).sendMsg(m) }
            }

            if (autoSignInList.length) {
                Bot.sendMasterMsg?.(`[Waves-Plugin] 自动签到\n今日成功签到 ${success} 个账号`)
            }
        }

        SignIn.locked = false;
        return true;
    }
}