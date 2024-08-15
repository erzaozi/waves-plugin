import plugin from '../../../lib/plugins/plugin.js'
import axios from 'axios'
import Render from '../model/render.js'

export class Calendar extends plugin {
    constructor() {
        super({
            name: "鸣潮-日历",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)日历$",
                    fnc: "calendar"
                }
            ]
        })
    }

    async calendar(e) {
        try {
            const { data } = await axios.get('https://ww.kuro.wiki/data/zhHans/activities.json');
            const now = Date.now();
            const ago = now - 7 * 24 * 60 * 60 * 1000;
            const soon = now + 7 * 24 * 60 * 60 * 1000;
            const oneYear = 365 * 24 * 60 * 60 * 1000;

            const calcTimeDiff = (s, e) => {

                const getDiff = (t) => {
                    const diff = Math.abs(now - t);
                    if (diff < 1000 * 60) return `${Math.floor(diff / 1000)} 秒`;
                    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 1000 / 60)} 分钟`;
                    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / 1000 / 60 / 60)} 小时`;
                    return `${Math.floor(diff / 1000 / 60 / 60 / 24)} 天`;
                };

                return {
                    toStart: getDiff(s),
                    toEnd: getDiff(e)
                };
            };

            const classify = (act, isRegular) => {
                let [start = 0, dur = 0] = isRegular ? act.time : act.time || [],
                    end = isRegular ? start + dur * (Math.floor((now - start) / dur) + 1) : dur;

                if (isRegular) start += dur * Math.floor((now - start) / dur);

                act.time = isRegular ? [start, end] : act.time;

                const { toStart, toEnd } = calcTimeDiff(start, end);

                if (!Array.isArray(act.time)) return null;
                act.time = act.time.map(t => new Date(t).toLocaleString('zh-CN', { hour12: false }));

                act.desc = act.desc ? act.desc.replace(/<br>/g, '\n') : '';

                if (end < now && end >= ago) {
                    act.time[1] += '（已结束' + toEnd + '）';
                    return { type: 'ended', act };
                }
                if (now >= start && now <= end && (end - now) <= oneYear) {
                    act.time[1] += '（' + toEnd + '后结束）';
                    return { type: 'ongoing', act };
                }
                if (start > now && start <= soon) {
                    act.time[1] += '（' + toStart + '后开始）';
                    return { type: 'upcoming', act };
                }
                return null;
            };

            const cat = { ended: [], ongoing: [], upcoming: [] };

            [...data.data.regular, ...data.data.schedule].forEach(act => {
                const result = classify(act, !!act.type);
                if (result) cat[result.type].push(result.act);
            });

            const imageCard = await Render.calendar(cat);
            await e.reply(imageCard);
            return true;
        } catch (error) {
            logger.error(`[Waves-Plugin] 获取日历数据失败：\n`, error);
            await e.reply('获取活动日历失败，请稍后再试')
            return false;
        }
    }
}
