import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";

export class BindToken extends plugin {
    constructor() {
        super({
            name: "鸣潮-用户登录",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)(登录|登陆|绑定).*$",
                    fnc: "bindToken"
                },
                {
                    reg: "^#?(waves|鸣潮)解绑.*$",
                    fnc: "unbindToken"
                }
            ]
        })
    }

    async bindToken(e) {
        const message = e.msg.replace(/#?(waves|鸣潮)(登录|登陆|绑定)/, '').trim();

        const waves = new Waves();
        let token;

        if (message.startsWith("eyJhbGc")) {
            token = message;
        } else {
            const [mobile, code] = message.split(":");

            if (!mobile || !code) {
                await e.reply("请输入正确的手机号与验证码\n使用[#鸣潮登录帮助]查看登录方法！");
                return true;
            }

            const data = await waves.getToken(mobile, code);

            if (!data.status) {
                await e.reply(`登录失败！原因：${data.msg}\n使用[#鸣潮登录帮助]查看登录方法！`);
                return true;
            }

            token = data.data.token;
        }

        const gameData = await waves.getGameData(token);

        if (!gameData.status) {
            await e.reply(`登录失败！原因：${gameData.msg}\n使用[#鸣潮登录帮助]查看登录方法！`);
            return true;
        }

        const userConfig = Config.getUserConfig(e.user_id);
        const userData = {
            token: token,
            userId: gameData.data.userId,
            serverId: gameData.data.serverId,
            roleId: gameData.data.roleId,
        };
        const userIndex = userConfig.findIndex(item => item.userId === gameData.data.userId);

        userIndex !== -1 ? (userConfig[userIndex] = userData) : userConfig.push(userData);

        Config.setUserConfig(e.user_id, userConfig);

        const msg = `${gameData.data.roleName}(${gameData.data.roleId}) 登录成功！`;

        return await e.reply(msg, true);
    }

    async unbindToken(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有绑定任何账号，请使用[#鸣潮登录]进行绑定');
        }

        let roleId = e.msg.replace(/#?(waves|鸣潮)解绑/, '').trim();
        if (!roleId || !accountList.map(item => item.roleId).includes(roleId)) {
            let msg = '当前绑定的特征码有：'
            accountList.forEach(item => {
                msg += `\n${item.roleId}`
            })
            msg += `\n请使用[#鸣潮解绑 + 特征码]的格式进行解绑。`
            await e.reply(msg);
        } else {
            let index = accountList.findIndex(item => item.roleId == roleId);
            accountList.splice(index, 1);
            await e.reply(`已删除账号 ${roleId}`);
            Config.setUserConfig(e.user_id, accountList);
        }
        return true;
    }
}