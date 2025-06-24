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
                    reg: "^(?:～|~|鸣潮)绑定(.*)$",
                    fnc: "bindUid"
                },
                {
                    reg: "^(?:～|~|鸣潮)(?:登录|登陆)(.*)$",
                    fnc: "loginAcc"
                },
                {
                    reg: "^(?:～|~|鸣潮)(?:删除登录|解除登录|解绑)(.*)$",
                    fnc: "unLogin"
                },
                {
                    reg: "^(～|~|鸣潮)(我的|库街区)[Tt]o?k(en)?$",
                    fnc: "getToken"
                }
            ]
        })
    }

    async bindUid(e) {
        const [, message] = e.msg.match(this.rule[0].reg);
        if (/^\d{9}$/.test(message)) {
            await redis.set(`Yunzai:waves:bind:${e.user_id}`, message);
            return await e.reply("绑定特征码成功！\n当前仅可查询部分信息，若想使用完整功能请使用[~登录]命令", true);
        } else {
            return await e.reply("请输入正确的特征码！如：[~绑定100000000]", true);
        }
    }

    async loginAcc(e) {
        const [, message] = e.msg.match(this.rule[1].reg);
        const waves = new Waves();
        let token;
        let warningMsg = "";
        let did = "";
        
        if (message.startsWith("eyJhbGc")) {
            if (e.isGroup) e.group.recallMsg(e.message_id);
            const cleanMessage = message.replace(/\s+/g, ''); // 移除所有空格
            if (cleanMessage.includes(",")) {
                [token, did] = cleanMessage.split(",", 2);
            } else {
                token = cleanMessage;
                warningMsg = "\n警告：未提供 did 字段，会导致其他登录设备下线！";
            }
    
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
            did = data.data.did;
        } else {
            if (!Config.getConfig().allow_login) {
                return await e.reply("当前网页登录功能已被禁用，请联系主人前往插件配置项中开启或使用其他登录方式进行登录\n使用[~登录帮助]查看其他登录方法！");
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
            did = Server.data[id].did;
            delete Server.data[id];
        }

        const gameData = await waves.getGameData(token);
        if (!gameData.status) {
            return await e.reply(`登录失败！原因：${gameData.msg}\n使用[~登录帮助]查看登录方法！`);
        }

        const userConfig = Config.getUserData(e.user_id);
        const userData = { token, did, userId: gameData.data.userId, serverId: gameData.data.serverId, roleId: gameData.data.roleId };
        const userIndex = userConfig.findIndex(item => item.userId === gameData.data.userId);
        userIndex !== -1 ? (userConfig[userIndex] = userData) : userConfig.push(userData);
        await redis.set(`Yunzai:waves:bind:${e.user_id}`, gameData.data.roleId);

        Config.setUserData(e.user_id, userConfig);
        return await e.reply(`${gameData.data.roleName}(${gameData.data.roleId}) 登录成功！${warningMsg}`, true);
    }
    async unLogin(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        const [, roleId] = e.msg.match(this.rule[2].reg);
        if (!roleId || !accountList.map(item => item.roleId).includes(roleId)) {
            let msg = '当前登录的特征码有：'
            accountList.forEach(item => {
                msg += `\n${item.roleId}`
            })
            msg += `\n请使用[~解除登录 + 特征码]的格式进行解绑。`
            await e.reply(msg);
        } else {
            let index = accountList.findIndex(item => item.roleId == roleId);
            accountList.splice(index, 1);
            await e.reply(`已删除账号 ${roleId}`);
            Config.setUserData(e.user_id, accountList);
        }
        return true;
    }

    async getToken(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);
        accountList = (accountList || []).map(account => ({
            ...account,
            did: account.did || ''
        }));
        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        if (e.isGroup) return await e.reply('为了您的账号安全，请私聊使用该指令');

        const tokenList = []
        accountList.forEach((item) => {
            tokenList.push({ message: item.roleId })
            
            if (item.did) {
                tokenList.push({ message: `${item.token},${item.did}` })
            } else {
                tokenList.push({ message: item.token })
            }
        })

        await e.reply(await Bot.makeForwardMsg(tokenList))
        return true;
    }
}