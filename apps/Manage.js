import plugin from '../../../lib/plugins/plugin.js';
import Config from "../components/Config.js";
import Waves from "../components/Code.js";
import { _path } from '../model/path.js';
import Render from '../components/Render.js';
import fs from 'fs/promises';
import pLimit from 'p-limit';
import YAML from 'yaml';

export class Manage extends plugin {
    constructor() {
        super({
            name: "鸣潮-管理用户",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(用户|账号|账户|tk)统计$",
                    fnc: "allUser"
                },
                {
                    reg: "^(～|~|鸣潮)删除失效(用户|账号|账户|tk)$",
                    fnc: "delUser"
                }
            ]
        });
    }

    async allUser(e) {
        if (!e.isMaster) return false;

        await e.reply('[Waves-Plugin] 正在统计用户总数，请稍等...');

        const waves = new Waves();
        const dir = `${_path}/data/waves`;

        try {
            const yamlFiles = (await fs.readdir(dir)).filter(name => name.endsWith('.yaml'));
            const userCounts = await Promise.all(yamlFiles.map(async file => {
                const content = await fs.readFile(`${dir}/${file}`, 'utf-8');
                return YAML.parse(content);
            }));

            const limit = pLimit(Config.getConfig().limit);
            const results = await Promise.all(
                userCounts.flat().map(user => limit(() => waves.isAvailable(user.serverId, user.roleId, user.token, user.did ? user.did : '' , true)))
            )

            const available = results.filter(Boolean).length;
            const expired = results.length - available;

            const bind = await redis.keys('Yunzai:waves:bind:*');

            const data = {
                total: results.length,
                bind: bind.length,
                login: yamlFiles.length,
                available: available,
                expired: expired
            };

            const imageCard = await Render.render('Template/userManage/userManage', {
                data,
            }, { e, retType: 'base64' });

            await e.reply(imageCard);
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`计算总用户数时出现错误`), logger.red(error));
            await e.reply('[Waves-Plugin] 账号总数\n计算总用户数时出现错误，请检查日志');
        }
    }

    async delUser(e) {
        if (!e.isMaster) return false;

        await e.reply('[Waves-Plugin] 正在删除失效账号，请稍等...');

        const waves = new Waves();
        const dir = `${_path}/data/waves`;

        try {
            const yamlFiles = (await fs.readdir(dir)).filter(name => name.endsWith('.yaml'));
            let deleted = 0;

            await Promise.all(yamlFiles.map(async (file) => {
                const users = YAML.parse(await fs.readFile(`${dir}/${file}`, 'utf-8'));
                const validUsers = await Promise.all(users.map(async (user) => {
                    const valid = await waves.isAvailable(user.serverId, user.roleId, user.token, user.did ? user.did : '' , true);
                    if (!valid) deleted++;
                    return valid ? user : null;
                }));

                Config.setUserData(file.slice(0, -5), validUsers.filter(Boolean));
            }));

            await e.reply(`[Waves-Plugin] 删除失效账号\n删除了 ${deleted} 个失效账号`);
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`删除失效账号时出现错误`), logger.red(error));
            await e.reply('[Waves-Plugin] 删除失效账号\n删除失效账号时出现错误，请检查日志');
        }
        return true;
    }
}