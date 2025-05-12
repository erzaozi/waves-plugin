import plugin from '../../../lib/plugins/plugin.js';
import axios from 'axios';

export class Reward extends plugin {
    constructor() {
        super({
            name: "鸣潮-兑换码",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(全部)?兑换码$",
                    fnc: "reward"
                }
            ]
        });
    }

    async reward(e) {
        try {
            const { data } = await axios.get("https://newsimg.5054399.com/comm/mlcxqcommon/static/wap/js/data_102.js?_=" + Date.now());
            const result = JSON.parse(data.match(/var mlList=(.*);/)[1]);

            const isAll = e.msg.includes("全部");

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const mlList = isAll ? result : result.filter(item => {
                const [m, d] = item.create_time.split("-").map(Number);

                let candidateYear = now.getFullYear();
                let candidateDate = new Date(candidateYear, m - 1, d);

                if (candidateDate > now) candidateDate = new Date(candidateYear - 1, m - 1, d);

                const timeDiff = now - candidateDate;
                return (timeDiff / 86400000) <= 7;
            });

            if (mlList.length === 0) {
                const msg = isAll ? "当前暂无兑换码" : "最近7天内没有可用的兑换码";
                await e.reply(msg + (isAll ? "" : "\n发送[~全部兑换码]查看完整兑换码列表"));
                return true;
            }

            const messages = mlList.map(item =>
                `兑换码：${item.order}\n状态：${item.is_fail === "0" ? "✅ 可兑换" : "❌ 已过期"}\n内容：${item.reward}` +
                (item.label ? `\n${item.label}` : "")
            );

            if (!isAll) {
                messages.unshift("※ 仅展示最近7天内的兑换码\n※ 发送[~全部兑换码]查看完整列表");
            } else {
                messages.unshift("※ 全部兑换码列表");
            }

            await e.reply(await Bot.makeForwardMsg(messages.map(msg => ({ message: msg }))));
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取兑换码出错`), logger.red(error));
            await e.reply("获取兑换码出错，请稍后再试");
        }

        return true;
    }
}
