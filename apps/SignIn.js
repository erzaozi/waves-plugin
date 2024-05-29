import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Render from '../model/render.js'

export class SignIn extends plugin {
    constructor() {
        super({
            name: "鸣潮-用户签到",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)签到$",
                    fnc: "signIn"
                }
            ]
        })
        this.task = {
            name: '[Waves-Plugin] 自动签到',
            fnc: () => this.autoSignIn(),
            cron: '0 4 * * *',
            log: true
        }
    }

    async signIn(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有绑定任何账号，请使用[#鸣潮登录]进行绑定');
        }

        const waves = new Waves();
        const data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await waves.isAvailable(account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新绑定Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            const signInData = await waves.signIn(account.serverId, account.roleId, account.userId, account.token);

            if (!signInData.status) {
                data.push({ message: signInData.msg });
            } else {
                const imageCard = await Render.signInData(signInData.data)
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

    async autoSignIn() {
        const { waves_auto_signin_list: autoSignInList } = Config.getConfig();
        let success = 0;
        for (let user of autoSignInList) {
            const [botId, groupId, userId] = user.split(':');
            const accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${userId}`)) || await Config.getUserConfig(userId);
            if (!accountList.length) {
                continue;
            }

            let data = [];
            let deleteroleId = [];

            for (let account of accountList) {
                const waves = new Waves();
                const usability = await waves.isAvailable(account.token);

                if (!usability) {
                    data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新绑定Token` });
                    deleteroleId.push(account.roleId);
                    continue;
                }

                let result = await waves.signIn(account.serverId, account.roleId, account.userId, account.token);

                if (result.status) success++

                await new Promise(resolve => setTimeout(resolve, 53000 + Math.floor((Math.random() * 42000))))
            }

            if (deleteroleId.length) {
                let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
                Config.setUserConfig(e.user_id, newAccountList);
            }

            if (data.length) Bot[botId]?.pickUser(userId).sendMsg(Bot.makeForwardMsg(data))
        }

        if (!Bot.sendMasterMsg) {
            const cfg = (await import("../../../lib/config/config.js")).default
            Bot.sendMasterMsg = async m => { for (const i of cfg.masterQQ) await Bot.pickFriend(i).sendMsg(m) }
        }

        if (autoSignInList.length) {
            Bot.sendMasterMsg?.(`[Waves-Plugin] 自动签到\n今日成功签到 ${success} 个账号`)
        }
    }
}