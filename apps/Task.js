import plugin from '../../../lib/plugins/plugin.js'
import Kuro from "../components/Kuro.js";
import Config from "../components/Config.js";
import Render from '../components/Render.js';

export class Task extends plugin {

    static locked = false;

    constructor() {
        super({
            name: "鸣潮-库街区任务",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(每日)?任务$",
                    fnc: "doTask"
                },
                {
                    reg: "^(～|~|鸣潮)(每日)?任务列表$",
                    fnc: "taskList"
                },
                {
                    reg: "^(～|~|鸣潮)全部(每日)?任务$",
                    fnc: "autoTask",
                    permission: 'master'
                }
            ]
        })
        this.task = {
            name: '[Waves-Plugin] 自动任务',
            fnc: () => this.autoTask(),
            cron: Config.getConfig().task_time
        }
    }

    async doTask(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        const kuro = new Kuro();
        const data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await kuro.isAvailable(account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            let postData = await kuro.getPost();
            if (!postData.status) {
                return { message: `获取帖子失败，无法继续任务` };
            }

            let postId = postData.data.postList[0].postId;
            let toUserId = postData.data.postList[0].userId;
            let message = `账号 ${account.userId} 的任务结果\n\n`;

            const signData = await kuro.signIn(account.token);
            message += signData.status ? `[用户签到] 签到成功` : `[用户签到] 签到失败，原因：${signData.msg}`;

            const detailPromises = Array.from({ length: 3 }, () => kuro.detail(postId, account.token));
            const detailResults = await Promise.all(detailPromises);
            const detailCount = detailResults.filter(detail => detail.status).length;
            message += `\n[浏览帖子] 浏览帖子成功 ${detailCount} 次`;

            const likePromises = Array.from({ length: 5 }, () => kuro.like(postId, toUserId, account.token));
            const likeResults = await Promise.all(likePromises);
            const likeCount = likeResults.filter(like => like.status).length;
            message += `\n[点赞帖子] 点赞帖子成功 ${likeCount} 次`;

            const shareData = await kuro.share(account.token);
            message += shareData.status ? `\n[分享帖子] 分享帖子成功` : `\n[分享帖子] 分享帖子失败，原因：${shareData.msg}`;

            message += `\n\n全部任务已完成，发送[~任务列表]查看当前任务状态与库洛币数量`;

            data.push({ message: message });
        }

        if (deleteroleId.length) {
            let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserData(e.user_id, newAccountList);
        }

        if (data.length === 1) {
            await e.reply(data[0].message);
            return true;
        }

        await e.reply(Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }

    async taskList(e) {
        let accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${e.user_id}`)) || await Config.getUserData(e.user_id);

        if (!accountList || !accountList.length) {
            return await e.reply('当前没有登录任何账号，请使用[~登录]进行登录');
        }

        const kuro = new Kuro();
        const data = [];
        let deleteroleId = [];

        for (let account of accountList) {
            const usability = await kuro.isAvailable(account.token);

            if (!usability) {
                data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                deleteroleId.push(account.roleId);
                continue;
            }

            const [taskData, coinData] = await Promise.all([
                kuro.taskProcess(account.token),
                kuro.getCoin(account.token)
            ]);

            if (!taskData.status || !coinData.status) {
                data.push({ message: taskData.msg || coinData.msg })
            } else {
                const imageCard = await Render.render('Template/taskList/taskList', {
                    taskData: taskData.data,
                    coinData: coinData.data,
                }, { e, retType: 'base64' });

                data.push({ message: imageCard });
            }
        }

        if (deleteroleId.length) {
            let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
            Config.setUserData(e.user_id, newAccountList);
        }

        if (data.length === 1) {
            await e.reply(data[0].message);
            return true;
        }

        await e.reply(Bot.makeForwardMsg([{ message: `用户 ${e.user_id}` }, ...data]));
        return true;
    }

    async autoTask() {
        if (Task.locked && (this.e ? await this.e.reply('已有社区任务运行中，请勿重复执行') : false)) return true;
        Task.locked = true;

        if (this.e) await this.e.reply('正在执行全部任务，稍后会推送签到结果');

        const { waves_auto_task_list: autoTaskList } = Config.getUserConfig();
        const { task_interval: interval } = Config.getConfig();
        let success = 0;
        for (let user of autoTaskList) {
            const { botId, groupId, userId } = user;
            const accountList = JSON.parse(await redis.get(`Yunzai:waves:users:${userId}`)) || await Config.getUserData(userId);
            if (!accountList.length) {
                continue;
            }

            const kuro = new Kuro();
            let data = [];
            let deleteroleId = [];

            for (let account of accountList) {
                const usability = await kuro.isAvailable(account.token);

                if (!usability) {
                    data.push({ message: `账号 ${account.roleId} 的Token已失效\n请重新登录Token` });
                    deleteroleId.push(account.roleId);
                    continue;
                }

                let postData = await kuro.getPost();
                if (!postData.status) {
                    return { message: `获取帖子失败，无法继续任务` };
                }

                let postId = postData.data.postList[0].postId;
                let toUserId = postData.data.postList[0].userId;

                const signData = await kuro.signIn(account.token);

                const detailPromises = Array.from({ length: 3 }, () => kuro.detail(postId, account.token));
                const detailResults = await Promise.all(detailPromises);
                const detailCount = detailResults.filter(detail => detail.status).length;

                const likePromises = Array.from({ length: 5 }, () => kuro.like(postId, toUserId, account.token));
                const likeResults = await Promise.all(likePromises);
                const likeCount = likeResults.filter(like => like.status).length;

                const shareData = await kuro.share(account.token);

                if (signData.status && detailCount === 3 && likeCount === 5 && shareData.status) {
                    success++;
                }

                await new Promise(resolve => setTimeout(resolve, interval * 1000));
            }

            if (deleteroleId.length) {
                let newAccountList = accountList.filter(account => !deleteroleId.includes(account.roleId));
                Config.setUserData(userId, newAccountList);
            }

            if (data.length) Bot[botId]?.pickUser(userId).sendMsg(Bot.makeForwardMsg(data))
        }

        if (this.e) {
            await this.e.reply(`[Waves-Plugin] 全部任务\n成功完成 ${success} 个账号`);
        } else {
            if (!Bot.sendMasterMsg) {
                const cfg = (await import("../../../lib/config/config.js")).default
                Bot.sendMasterMsg = async m => { for (const i of cfg.masterQQ) await Bot.pickFriend(i).sendMsg(m) }
            }

            if (autoTaskList.length) {
                Bot.sendMasterMsg?.(`[Waves-Plugin] 自动任务\n今日成功任务 ${success} 个账号`)
            }
        }

        Task.locked = false;
        return true;
    }
}