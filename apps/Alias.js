import { pluginResources } from '../model/path.js';
import Config from '../components/Config.js';
import Wiki from '../components/Wiki.js';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';

export class Alias extends plugin {
    constructor() {
        super({
            name: '鸣潮-别名设置',
            event: 'message',
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)添加(.*?)(?:别名|昵称)(.*)$",
                    fnc: 'addAlias'
                },
                {
                    reg: "^(?:～|~|鸣潮)删除(.*?)(?:别名|昵称)(.*)$",
                    fnc: "delAlias"
                },
                {
                    reg: "^(?:～|~|鸣潮)(.*?)(?:别名|昵称)$",
                    fnc: 'aliasList'
                }
            ]
        });
    }

    async addAlias(e) {
        const { allow_set_alias } = Config.getConfig();
        if (!e.isMaster && !allow_set_alias) return e.reply('只有主人才能添加别名');

        const [, char, alias] = e.msg.match(this.rule[0].reg);
        if (!char || !alias) return e.reply('请输入正确的命令格式，如：[~添加今汐别名龙女]');

        const wiki = new Wiki();
        const [entryData, aliasData] = await Promise.all([
            wiki.getEntry(char),
            wiki.getEntry(alias)
        ]);

        if (!entryData.status) return e.reply(`未找到名为 ${char} 的游戏内容，请检查名称再试`);
        if (aliasData.status) return e.reply(`已存在名为 ${alias} 的游戏内容，不可将已有的游戏内容名称设置为别名，请更换其他别名`);

        const data = await this._readAliases();
        if ((data[char] || []).includes(alias)) {
            return e.reply(`${char} 已经存在别名 ${alias}`);
        }

        data[char] = [...(data[char] || []), alias];
        await this._writeAliases(data);

        return e.reply(`添加 ${char} 别名 ${alias} 成功`);
    }

    async aliasList(e) {
        const [, char] = e.msg.match(this.rule[2].reg);
        if (!char) return e.reply('请输入正确的命令格式，如：[~今汐别名]');
        const data = await this._readAliases();

        const aliases = data[char] || [];
        const msg = aliases.length > 0
            ? `${char} 的别名有：\n${aliases.join('\n')}`
            : `${char} 未设置任何别名`;

        return e.reply(msg);
    }

    async delAlias(e) {
        const { allow_set_alias } = Config.getConfig();
        if (!e.isMaster && !allow_set_alias) return e.reply('只有主人才能删除别名');

        const [, char, alias] = e.msg.match(this.rule[1].reg);
        if (!char || !alias) return e.reply('请输入正确的命令格式，如：[~删除今汐别名龙女]');

        const data = await this._readAliases();

        if (!data[char]) return e.reply(`${char} 未设置任何别名`);

        const index = data[char].indexOf(alias);
        if (index === -1) return e.reply(`${char} 未设置别名 ${alias}，请使用 [~${char}别名] 查看已设置别名`);

        data[char].splice(index, 1);
        await this._writeAliases(data);

        return e.reply(`删除 ${char} 别名 ${alias} 成功`);
    }

    async _readAliases() {
        const filePath = path.join(pluginResources, '/Alias/custom/custom.yaml');
        const dir = path.dirname(filePath);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');

        return YAML.parse(fs.readFileSync(filePath, 'utf8'));
    }

    async _writeAliases(data) {
        const filePath = path.join(pluginResources, '/Alias/custom/custom.yaml');
        fs.writeFileSync(filePath, YAML.stringify(data));
    }
}