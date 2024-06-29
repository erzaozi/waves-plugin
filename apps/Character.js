import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import TapTap from '../components/Taptap.js';
import Config from "../components/Config.js";
import Wiki from '../components/Wiki.js';
import Render from '../model/render.js';

export class Character extends plugin {
    constructor() {
        super({
            name: "鸣潮-角色面板",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮).*面板(\\d{9})?$",
                    fnc: "character"
                }
            ]
        })
    }

    async character(e) {

        if (e.at) e.user_id = e.at;
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserConfig(e.user_id);
        const waves = new Waves();

        const match = e.msg.match(/\d{9}$/);

        if (!accountList.length) {
            if (match || await redis.get(`Yunzai:waves:bind:${e.user_id}`)) {
                let publicCookie = await waves.getPublicCookie();
                if (!publicCookie) {
                    return await e.reply('当前没有可用的公共Cookie，请使用[~登录]进行绑定');
                } else {
                    if (match) {
                        publicCookie.roleId = match[0];
                        await redis.set(`Yunzai:waves:bind:${e.user_id}`, publicCookie.roleId);
                    } else if (await redis.get(`Yunzai:waves:bind:${e.user_id}`)) {
                        publicCookie.roleId = await redis.get(`Yunzai:waves:bind:${e.user_id}`);
                    }
                    accountList.push(publicCookie);
                }
            } else {
                return await e.reply('当前没有绑定任何账号，请使用[~登录]进行绑定');
            }
        }

        const matchName = e.msg.match(/(～|~|鸣潮)?(.*?)面板/);
        if (!matchName || !matchName[2]) {
            return false
        }

        const message = matchName[2];

        const wiki = new Wiki();
        const name = await wiki.getAlias(message);

        let data = [];
        let deleteroleId = [];

        await Promise.all(accountList.map(async (account) => {
            const usability = await waves.isAvailable(account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新绑定Token` });
                deleteroleId.push(account.roleId);
                return;
            }

            if (match) {
                account.roleId = match[0];
                await redis.set(`Yunzai:waves:bind:${e.user_id}`, account.roleId);
            }

            const roleData = await waves.getRoleData(account.serverId, account.roleId, account.token);

            if (!roleData.status) {
                data.push({ message: roleData.msg });
                return;
            }

            const char = roleData.data.roleList.find(role => role.roleName === name);

            if (!char) {
                data.push({ message: `UID: ${account.roleId} 还未拥有共鸣者 ${name}` });
                return;
            }

            const tapId = await redis.get(`Yunzai:waves:taptap:${account.roleId}`);

            const roleDetail = await waves.getRoleDetail(account.serverId, account.roleId, char.roleId, account.token)

            if (!roleDetail.status) {
                data.push({ message: roleDetail.msg });
                return;
            }

            let tapRoleData;
            if (tapId) {
                const taptap = new TapTap();
                const result = await taptap.getCharInfo(tapId, name);
                if (result.status) tapRoleData = result.data;
            }

            const imageCard = await Render.charProfile({ uid: account.roleId, roleDetail, tapRoleData });
            data.push({ message: imageCard });

        }));

        if (deleteroleId.length) {
            const newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
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