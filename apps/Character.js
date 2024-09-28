import plugin from '../../../lib/plugins/plugin.js'
import WeightCalculator from '../utils/Calculate.js'
import { pluginResources } from '../model/path.js';
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import Wiki from '../components/Wiki.js';
import Render from '../model/render.js';
import path from 'path';
import fs from 'fs';

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
        let name = await wiki.getAlias(message);

        let data = [];
        let deleteroleId = [];
        let imgList = [];

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

            // 处理主角名称
            if (name == '漂泊者-男-衍射' || name == '漂泊者-女-衍射') {
                name = '漂泊者'
            } else if (name.includes('漂泊者')) {
                name = name.replace(/-男-|-女-/g, '·');
            }

            const char = roleData.data.roleList.find(role => role.roleName === name);

            if (!char) {
                data.push({ message: `UID: ${account.roleId} 还未拥有共鸣者 ${name}` });
                return;
            }

            const roleDetail = await waves.getRoleDetail(account.serverId, account.roleId, char.roleId, account.token)

            if (!roleDetail.status) {
                data.push({ message: roleDetail.msg });
                return;
            }

            if (!roleDetail.data.role) {
                data.push({ message: `UID: ${account.roleId} 未在库街区展示共鸣者 ${name}，请在库街区展示此角色，或使用[~绑定]绑定账号后即可查看所有角色` });
                return;
            }

            const rolePicDir = path.join(pluginResources, 'rolePic', name);
            const rolePicUrl = fs.existsSync(rolePicDir) 
                ? `file://${rolePicDir}/${fs.readdirSync(rolePicDir).filter(file => path.extname(file).toLowerCase() === '.webp')[Math.floor(Math.random() * fs.readdirSync(rolePicDir).length)]}` 
                : roleDetail.data.role.rolePicUrl;
            
            imgList.push(rolePicUrl);

            roleDetail.data = (new WeightCalculator(roleDetail.data)).calculate()
            const imageCard = await Render.charProfile({ uid: account.roleId, rolePicUrl, roleDetail });
            data.push({ message: imageCard });

        }));

        if (deleteroleId.length) {
            const newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserConfig(e.user_id, newAccountList);
        }

        imgList = [...new Set(imgList)];

        const msgData = data.length === 1 
            ? data[0].message 
            : Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]);
            
        const msgRes = await e.reply(msgData);
        const message_id = Array.isArray(msgRes?.message_id) 
            ? msgRes.message_id 
            : [msgRes?.message_id].filter(Boolean);
        
        for (const id of message_id) {
            await redis.set(`Yunzai:waves:originpic:${id}`, JSON.stringify({ type: 'profile', img: imgList }), { EX: 3600 * 3 });
        }
        
        return true;
    }
}