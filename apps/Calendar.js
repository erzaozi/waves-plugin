import plugin from '../../../lib/plugins/plugin.js';
import { pluginResources } from '../model/path.js'
import Wiki from '../components/Wiki.js';
import Render from '../components/Render.js';

export class Calendar extends plugin {
    constructor() {
        super({
            name: "鸣潮-日历",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(日历|日历列表|当前卡池)$",
                    fnc: "calendar"
                }
            ]
        });
    }

    async calendar(e) {
        const wiki = new Wiki();
        const pageData = await wiki.getHomePage();
        const currentDate = new Date();

        if (!pageData.status) {
            return e.reply(data.msg);
        }

        const role = {
            imgs: (pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.imgs || []).map(item => item.img),
            description: pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.description || '',
            unstart: new Date(pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.countDown?.dateRange?.[0]) > currentDate,
            time: this.format(Math.max(Math.round((new Date(pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.countDown?.dateRange?.[1]) - currentDate) / 1000), 0)),
            progress: Math.round(((currentDate - new Date(pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.countDown?.dateRange?.[0])) /
                (new Date(pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.countDown?.dateRange?.[1]) - new Date(pageData.data.contentJson?.sideModules?.[0]?.content?.tabs?.[0]?.countDown?.dateRange?.[0]))) * 100)
        };

        const weapon = {
            imgs: (pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.imgs || []).map(item => item.img),
            description: pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.description || '',
            unstart: new Date(pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.countDown?.dateRange?.[0]) > currentDate,
            time: this.format(Math.max(Math.round((new Date(pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.countDown?.dateRange?.[1]) - currentDate) / 1000), 0)),
            progress: Math.round(((currentDate - new Date(pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.countDown?.dateRange?.[0])) /
                (new Date(pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.countDown?.dateRange?.[1]) - new Date(pageData.data.contentJson?.sideModules?.[1]?.content?.tabs?.[0]?.countDown?.dateRange?.[0]))) * 100)
        }

        const activity = (pageData.data.contentJson?.sideModules?.[2]?.content || []).map(item => {
            const dateRange = item.countDown?.dateRange || ["", ""];
            const [startDateStr, endDateStr] = dateRange.map(dateStr => dateStr ? new Date(dateStr) : null);
            const startDate = startDateStr || null;
            const endDate = endDateStr || null;

            const startTime = startDate ? `${startDate.toLocaleDateString('zh-CN').slice(5).replace('/', '.')} ${startDate.toTimeString().slice(0, 5)}` : '';
            const endTime = endDate ? `${endDate.toLocaleDateString('zh-CN').slice(5).replace('/', '.')} ${endDate.toTimeString().slice(0, 5)}` : '';

            const activeStatus = item.countDown
                ? (startDate && currentDate >= endDate ? '已结束' :
                    (startDate && currentDate >= startDate ? '进行中' : '未开始'))
                : '';

            const remain = activeStatus === '进行中' && endDate
                ? this.format(Math.round((endDate - currentDate) / 1000))
                : '';

            const progress = startDate && endDate && currentDate >= startDate
                ? Math.round(((currentDate - startDate) / (endDate - startDate)) * 100)
                : 0;

            return {
                contentUrl: item.contentUrl || '',
                title: item.title || '',
                time: startTime && endTime ? `${startTime} - ${endTime}` : '',
                active: activeStatus,
                remain: remain,
                progress: progress,
            };
        });

        const s = 1716753600000;
        const d = 1209600000;

        activity.unshift({
            contentUrl: pluginResources + '/Template/calendar/imgs/tower.png',
            title: '深境再临',
            time: (() => {
                const cs = s + Math.floor((currentDate - s) / d) * d;
                return `${new Date(cs).toLocaleDateString('zh-CN').slice(5).replace('/', '.')} ${new Date(cs).toTimeString().slice(0, 5)} - ${new Date(cs + d).toLocaleDateString('zh-CN').slice(5).replace('/', '.')} ${new Date(cs + d).toTimeString().slice(0, 5)}`;
            })(),
            active: '进行中',
            remain: this.format(Math.round((s + Math.floor((currentDate - s) / d) * d + d - currentDate) / 1000)),
            progress: Math.round(((currentDate - (s + Math.floor((currentDate - s) / d) * d)) / d) * 100),
        });

        const imageCard = await Render.render('Template/calendar/calendar', {
            data: { activity, role, weapon },
        }, { e, retType: 'base64' });

        await e.reply(imageCard);
        return true;
    }

    format(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        return `${days ? `${days}天` : ''}${days || hours ? `${hours}小时` : ''}${days || hours || minutes ? `${minutes}分钟` : ''}`.trim();
    }
}