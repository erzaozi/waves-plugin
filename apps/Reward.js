import plugin from '../../../lib/plugins/plugin.js';
import axios from 'axios';

const LABELS = { available: '可用兑换码', longTerm: '长期兑换码', expired: '过期兑换码' };

export class Reward extends plugin {
    constructor() {
        super({
            name: "鸣潮-兑换码",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)兑换码$",
                    fnc: "reward"
                }
            ]
        });
    }

    async reward(e) {
        try {
            const { data } = await axios.get("https://newsimg.5054399.com/comm/mlcxqcommon/static/wap/js/data_102.js?");
            const mlList = JSON.parse(data.match(/var mlList=(.*);/)[1]);

            const categorized = mlList.reduce((acc, item) => {
                if (item.is_fail === '1') acc.expired.push(item);
                else if (item.label === '') acc.longTerm.push(item);
                else acc.available.push(item);
                return acc;
            }, { available: [], longTerm: [], expired: [] });

            const messages = Object.entries(categorized)
                .filter(([_, codes]) => codes.length > 0)
                .map(([status, codes]) => {
                    const message = codes.map((item, index) => `${index + 1}. ${item.order}${item.label ? `\n┗ ${item.label}` : ''}`).join('\n');
                    return `===== ${LABELS[status]} ${codes.length} 个 =====\n${message}`;
                });

            await e.reply(Bot.makeForwardMsg(messages.map(msg => ({ message: msg }))));
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取兑换码出错`), logger.red(error));
            await e.reply("获取兑换码出错，请稍后再试");
        }

        return true;
    }
}
