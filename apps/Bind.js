import plugin from '../../../lib/plugins/plugin.js'
import Config from "../components/Config.js";
import Server from "../components/Server.js";
import Waves from "../components/Code.js";

export class Bind extends plugin {
    constructor() {
        super({
            name: "鸣潮-用户登录",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(登录|登陆).*$",
                    fnc: "Login"
                },
                {
                    reg: "^(～|~|鸣潮)绑定.*$",
                    fnc: "Bind"
                },
                {
                    reg: "^(～|~|鸣潮)解绑.*$",
                    fnc: "Unlogin"
                },
                {
                    reg: "^(～|~)?库街区Token$",
                    fnc: "Get"
                }
            ]
        })
    }

    async Bind(e) {
        const message = e.msg.replace(/^(～|~|鸣潮)绑定/, '').trim();
        if (/^\d{9}$/.test(message)) {
            await redis.set(`Yunzai:waves:bind:${e.user_id}`, message);
            return await e.reply("绑定特征码成功！\n当前仅可查询部分信息，若想使用完整功能请使用[~登录]命令");
        } else {
            return await e.reply("请输入正确的特征码！如：[~绑定100000000]");
        }
    }

    async Login(e) {
        const message = e.msg.replace(/^(～|~|鸣潮)(登录|登陆)/, '').trim();
        const waves = new Waves();
        let token;

        if (message.startsWith("eyJhbGc")) {
            if (e.isGroup) e.group.recallMsg(e.message_id)
            token = message;
        } else if (message) {
            if (e.isGroup) e.group.recallMsg(e.message_id)
            const [mobile, _, code] = message.split(/(:|：)/);
            if (!mobile || !code) {
                return await e.reply("请输入正确的手机号与验证码\n使用[~登录帮助]查看登录方法！");
            }
            const data = await waves.getToken(mobile, code);
            if (!data.status) {
                return await e.reply(`登录失败！原因：${data.msg}\n使用[~登录帮助]查看登录方法！`);
            }
            token = data.data.token;
        } else {
            if (!Config.getConfig().allow_login) {
                return await e.reply("当前网页登录功能已被禁用，请联系主人开启或使用其他登录方式进行登录\n使用[~登录帮助]查看登录方法！");
            }
            const id = Math.random().toString(36).substring(2, 12);
            Server.data[id] = { user_id: e.user_id };
            await e.reply(`请复制登录地址到浏览器打开：\n${Config.getConfig().public_link}/login/${id}\n您的识别码为【${e.user_id}】\n登录地址10分钟内有效`);

            const timeout = Date.now() + 10 * 60 * 1000;
            while (!Server.data[id].token && Date.now() < timeout) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            if (!Server.data[id].token) {
                delete Server.data[id];
                return await e.reply('在线登录超时，请重新登录', true);
            }
            token = Server.data[id].token;
            delete Server.data[id];
        }

        const gameData = await waves.getGameData(token);
        if (!gameData.status) {
            return await e.reply(`登录失败！原因：${gameData.msg}\n使用[~登录帮助]查看登录方法！`);
        }

        const userConfig = Config.getUserConfig(e.user_id);
        const userData = { token, userId: gameData.data.userId, serverId: gameData.data.serverId, roleId: gameData.data.roleId };
        const userIndex = userConfig.findIndex(item => item.userId === gameData.data.userId);
        userIndex !== -1 ? (userConfig[userIndex] = userData) : userConfig.push(userData);

        Config.setUserConfig(e.user_id, userConfig);
        return await e.reply(`${gameData.data.roleName}(${gameData.data.roleId}) 登录成功！`, true);
    }
    async Unlogin(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        let roleId = e.msg.replace(/^(～|~|鸣潮)解绑/, '').trim();
        if (!roleId || !accountList.map(item => item.roleId).includes(roleId)) {
            let msg = '当前登录的特征码有：'
            accountList.forEach(item => {
                msg += `\n${item.roleId}`
            })
            msg += `\n请使用[~解绑 + 特征码]的格式进行解绑。`
            await e.reply(msg);
        } else {
            let index = accountList.findIndex(item => item.roleId == roleId);
            accountList.splice(index, 1);
            await e.reply(`已删除账号 ${roleId}`);
            Config.setUserConfig(e.user_id, accountList);
        }
        return true;
    }

    async Get(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        if (e.isGroup) return await e.reply('为了您的账号安全，请私聊使用该指令');

        const tokenList = []
        accountList.forEach((item) => {
            tokenList.push({ message: item.roleId })
            tokenList.push({ message: item.token })
        })

        await e.reply(Bot.makeForwardMsg(tokenList))
        return true;
    }
}