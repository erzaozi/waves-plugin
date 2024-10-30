import plugin from '../../../lib/plugins/plugin.js';
import { pluginResources } from '../model/path.js';
import Config from "../components/Config.js";
import Wiki from '../components/Wiki.js';
import fs from 'fs';

const AUTHORS = [
    { name: "小沐XMu", path: "/Strategy/XMu/" },
    { name: "Moealkyne", path: "/Strategy/moealkyne/" },
    { name: "金铃子攻略组", path: "/Strategy/Linn/" }
];

export class Strategy extends plugin {
    constructor() {
        super({
            name: "鸣潮-攻略",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)?(.*)攻略$",
                    fnc: "strategy"
                }
            ]
        });
    }

    async strategy(e) {
        const [, message] = e.msg.match(this.rule[0].reg);

        if (!message) return e.reply("请输入正确的命令格式，如：[～今汐攻略]")

        const wiki = new Wiki();
        const name = await wiki.getAlias(message);
        const provide = await Config.getConfig().strategy_provide;

        let messages = [];

        if (provide === "all") {
            for (const { name: authorName, path } of AUTHORS) {
                const imagePath = `${pluginResources}${path}${name}.jpg`;
                if (fs.existsSync(imagePath)) {
                    messages.push(
                        { message: `来自 ${authorName} 的角色攻略：` },
                        { message: segment.image(imagePath) }
                    );
                }
            }
        } else {
            const imagePath = `${pluginResources}/Strategy/${provide}/${name}.jpg`;
            if (fs.existsSync(imagePath)) {
                messages.push({ message: segment.image(imagePath) });
            }
        }

        if (messages.length === 0) {
            if (/^(～|~|鸣潮)/.test(e.msg)) {
                await e.reply(`暂时还没有${message}的攻略`);
                return true;
            }
            return false;
        }

        await e.reply(messages.length === 1 ? messages[0].message : Bot.makeForwardMsg(messages));
        return true;
    }
}
