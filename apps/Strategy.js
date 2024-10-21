import plugin from '../../../lib/plugins/plugin.js';
import { pluginResources } from '../model/path.js';
import Wiki from '../components/Wiki.js';
import fs from 'fs';

const AUTHORS = [
    { name: "小沐XMu", path: "/Strategy/XMu/" },
    { name: "moealkyne", path: "/Strategy/moealkyne/" },
    { name: "金铃子", path: "/Strategy/Linn/" }
];

export class Strategy extends plugin {
    constructor() {
        super({
            name: "鸣潮-攻略",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)?.*攻略$",
                    fnc: "strategy"
                }
            ]
        });
    }

    async strategy(e) {
        const match = e.msg.match(/(～|~|鸣潮)?(.*?)攻略/);
        if (!match || !match[2]) return false;

        const message = match[2];
        const wiki = new Wiki();
        const name = await wiki.getAlias(message);

        let messages = [];
        for (const { name: authorName, path } of AUTHORS) {
            const imagePath = `${pluginResources}${path}${name}.jpg`;
            if (fs.existsSync(imagePath)) {
                messages.push(
                    { message: `来自 ${authorName} 的角色攻略：` },
                    { message: segment.image(imagePath) }
                );
            }
        }

        if (messages.length === 0) {
            logger.warn(`[Waves-Plugin] 未能获取攻略角色：${message}`)
            if (/^(～|~|鸣潮)/.test(e.msg)) {
                await e.reply(`暂时还没有${message}的攻略`);
                return true;
            }
            return false;
        }

        await e.reply(await e.runtime?.common?.makeForwardMsg(e, messages));
        return true;
    }
}
