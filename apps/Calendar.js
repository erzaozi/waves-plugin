import plugin from '../../../lib/plugins/plugin.js';
import Wiki from '../components/Wiki.js';
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
        });
    }

    async calendar(e) {
        const wiki = new Wiki();
        const pageData = await wiki.getHomePage();
        const currentDate = new Date();

        if (!pageData.status) {
            return e.reply(data.msg);
        }

        const data = (pageData.data.contentJson?.sideModules?.[2]?.content || []).map(item => {
            const dateRange = item.countDown?.dateRange || ["", ""];
            const [startDateStr, endDateStr] = dateRange.map(dateStr => dateStr ? new Date(dateStr) : null);
            const startDate = startDateStr || null;
            const endDate = endDateStr || null;

            const startTime = startDate ? `${startDate.toISOString().slice(5, 10).replace('-', '.')} ${startDate.toTimeString().slice(0, 5)}` : '';
            const endTime = endDate ? `${endDate.toISOString().slice(5, 10).replace('-', '.')} ${endDate.toTimeString().slice(0, 5)}` : '';

            const activeStatus = item.countDown
                ? (startDate && currentDate >= startDate ? '进行中' : '未开始')
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
                progress: progress + '%',
            };
        });

        const imageCard = await Render.calendar(data);
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