import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Config from "../components/Config.js";
import pLimit from 'p-limit';

export class News extends plugin {
    constructor() {
        super({
            name: "鸣潮-新闻推送",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(活动|新闻|公告|资讯)$",
                    fnc: "queryNews",
                }
            ]
        })
        this.task = {
            name: '[Waves-Plugin] 新闻推送',
            fnc: () => this.autoNews(),
            cron: Config.getConfig().news_push_time,
            log: false
        }
    }

    async queryNews(e) {
        const eventType = e.msg.includes('活动') ? 1 : e.msg.includes('资讯') ? 2 : e.msg.includes('公告') ? 3 : 0;

        const waves = new Waves();
        const newsData = await waves.getEventList(eventType);

        const data = [];

        if (!newsData.status) {
            data.push({ message: newsData.msg });
        } else {
            newsData.data.list.slice(0, 20).forEach(item => {
                data.push({ message: [segment.image(item.coverUrl), `${item.postTitle}\nhttps://www.kurobbs.com/mc/post/${item.postId}\n\n${new Date(item.publishTime).toLocaleString()}`] });
            });
        }
        await e.reply(await Bot.makeForwardMsg(data));
        return true;
    }

    async autoNews() {
        const { waves_auto_news_list: autoPushList } = Config.getUserConfig();

        if (!autoPushList.length) {
            return true;
        }

        const waves = new Waves();
        const newsData = await waves.getEventList();

        if (!newsData.status) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(newsData.msg));
            return true;
        }

        const { postId } = newsData.data.list[0];
        if (postId != await redis.get(`Yunzai:waves:news`)) {
            const limit = pLimit(Config.getConfig().limit);
            await Promise.all(autoPushList.map(user =>
                limit(async () => {
                    const { botId, groupId, userId } = user;

                    let isGroup = !!groupId;
                    let id = isGroup ? groupId : userId;

                    if (isGroup) {
                        await Bot[botId]?.pickGroup(id).sendMsg([
                            segment.image(newsData.data.list[0].coverUrl),
                            `${newsData.data.list[0].postTitle}\nhttps://www.kurobbs.com/mc/post/${newsData.data.list[0].postId}\n\n${new Date(newsData.data.list[0].publishTime).toLocaleString()}`
                        ]);
                    } else {
                        await Bot[botId]?.pickUser(id).sendMsg([
                            segment.image(newsData.data.list[0].coverUrl),
                            `${newsData.data.list[0].postTitle}\nhttps://www.kurobbs.com/mc/post/${newsData.data.list[0].postId}\n\n${new Date(newsData.data.list[0].publishTime).toLocaleString()}`
                        ]);
                    }

                    redis.set(`Yunzai:waves:news`, postId);
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`已推送最新公告`));
                    return true;
                })));
        } else {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`未获取到新公告`));
            return true;
        }
    }
}
