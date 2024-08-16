import plugin from '../../../lib/plugins/plugin.js'
import Waves from "../components/Code.js";
import Wiki from "../components/Wiki.js";
import Render from '../model/render.js'

const resident = ["鉴心", "卡卡罗", "安可", "维里奈", "凌阳"]

export class Gacha extends plugin {
    constructor() {
        super({
            name: "鸣潮-抽卡统计",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)抽卡(统计|分析|记录)([\\s\\S]*)$",
                    fnc: "gachaCount"
                }
            ]
        })
    }

    async gachaCount(e) {
        let message = e.msg.replace(/^(～|~|鸣潮)抽卡(统计|分析|记录)/, "");

        if (!message) {
            await e.reply(`请在命令后面携带请求体或链接\n例：~抽卡统计{"recordId":"2b798246702...\n各平台抽卡记录获取详细步骤请发送[~抽卡帮助]`);
            return true;
        }

        let jsonData = {};
        const isJson = message.startsWith("{");
        const isUrl = message.match(/https?:\/\/[^\s/$.?#].[^\s]*/g);

        if (isJson) {
            try {
                jsonData = JSON.parse(message);
                if (!jsonData.playerId || !jsonData.recordId) {
                    throw new Error("缺少playerId或recordId");
                }
            } catch (error) {
                await e.reply(error.message || "无法转换成JSON格式，请复制完整请求体");
                return true;
            }
        } else if (isUrl) {
            message = isUrl[0].replace(/#/, "");
            try {
                const params = new URL(message).searchParams;
                jsonData.playerId = params.get("player_id");
                jsonData.recordId = params.get("record_id");
                jsonData.serverId = params.get("svr_id");
                if (!jsonData.playerId || !jsonData.recordId) {
                    throw new Error("缺少player_id或record_id");
                }
            } catch {
                await e.reply("无法解析链接，请复制完整链接");
                return true;
            }
        } else {
            await e.reply("未能解析成功，请在命令后面携带请求体或链接，各平台抽卡记录获取详细步骤请发送[~抽卡帮助]");
            return true;
        }

        await e.reply("正在分析您的抽卡记录，请稍后...");

        const data = {
            "playerId": jsonData.playerId,
            "serverId": jsonData.serverId || "76402e5b20be2c39f095a152090afddc",
            "languageCode": jsonData.languageCode || "zh-Hans",
            "recordId": jsonData.recordId
        }

        const waves = new Waves();
        const upCharPool = await waves.getGaCha({ ...data, "cardPoolId": "1", "cardPoolType": "1" })
        const upWpnPool = await waves.getGaCha({ ...data, "cardPoolId": "2", "cardPoolType": "2" })
        const stdCharPool = await waves.getGaCha({ ...data, "cardPoolId": "3", "cardPoolType": "3" })
        const stdWpnPool = await waves.getGaCha({ ...data, "cardPoolId": "4", "cardPoolType": "4" })

        if (!upCharPool.status || !upWpnPool.status || !stdCharPool.status || !stdWpnPool.status) {
            await e.reply("获取抽卡记录失败：" + upCharPool.msg || upWpnPool.msg || stdCharPool.msg || stdWpnPool.msg);
            return true;
        }

        const renderData = {
            "playerId": jsonData.playerId,
            "upCharPool": await this.dataFormat(upCharPool.data),
            "upWpnPool": await this.dataFormat(upWpnPool.data),
            "stdCharPool": await this.dataFormat(stdCharPool.data),
            "stdWpnPool": await this.dataFormat(stdWpnPool.data)
        }

        const imageCard = await Render.gachaCount(renderData);
        await e.reply(imageCard);

        return true;
    }

    // 处理数据
    async dataFormat(array) {
        const no5Star = ((idx => (idx === -1 ? 0 : idx))(array.findIndex(item => item.qualityLevel === 5)));
        const no4Star = ((idx => (idx === -1 ? 0 : idx))(array.findIndex(item => item.qualityLevel === 4)));
        const fiveStar = array.filter(item => item.qualityLevel === 5).length;
        const fourStar = array.filter(item => item.qualityLevel === 4).length;
        const std5Star = array.filter(item => item.qualityLevel === 5 && resident.includes(item.name)).length;
        const fourStarWpn = array.filter(item => item.qualityLevel === 4 && item.resourceType === "武器").length;
        const max4Star = Object.entries(array.filter(item => item.qualityLevel === 4).reduce((acc, item) => (acc[item.name] = (acc[item.name] || 0) + 1, acc), {})).reduce((max, curr) => curr[1] > max[1] ? curr : max, ['无', 0])[0];
        const avg5Star = (fiveStar !== 0) ? Math.round((array.length - no5Star) / fiveStar) : 0;
        const avg4Star = (fourStar !== 0) ? Math.round((array.length - no4Star) / fourStar) : 0;
        const avgUP = (fiveStar - std5Star !== 0) ? Math.round((array.length - no5Star) / (fiveStar - std5Star)) : 0;
        const minPit = (fiveStar === std5Star ? 0.0 : (((fiveStar - std5Star) - std5Star) / (fiveStar - std5Star) * 100).toFixed(1));
        const upCost = (avgUP * 160 / 10000).toFixed(2);
        const worstLuck = Math.max(...(array.map((item, index) => item.qualityLevel === 5 ? index : -1).filter(index => index !== -1).reduce((gaps, curr, i, arr) => (i > 0 ? [...gaps, curr - arr[i - 1]] : gaps), [])), array.length - (array.map((item, index) => item.qualityLevel === 5 ? index : -1).filter(index => index !== -1).slice(-1)[0] + 1)) || 0;
        const bestLuck = Math.min(...(array.map((item, index) => item.qualityLevel === 5 ? index : -1).filter(index => index !== -1).reduce((gaps, curr, i, arr) => (i > 0 ? [...gaps, curr - arr[i - 1]] : gaps), [])), array.length - (array.map((item, index) => item.qualityLevel === 5 ? index : -1).filter(index => index !== -1).slice(-1)[0] + 1)) || 0;

        const wiki = new Wiki();
        const pool = await Promise.all(array.filter(item => item.qualityLevel === 5).map(async (item) => ({ name: item.name, times: (array.slice(array.indexOf(item) + 1).findIndex(x => x.qualityLevel === 5) + 1) || (array.length - array.indexOf(item)), isUp: !resident.includes(item.name), avatar: (await wiki.getRecord(item.name)).record.content.contentUrl })));

        return {
            info: {
                total: array.length,
                time: array.length > 0 ? [array[0].time, array[array.length - 1].time] : [null, null],
                no5Star: no5Star,
                no4Star: no4Star,
                fiveStar: fiveStar,
                fourStar: fourStar,
                std5Star: std5Star,
                fourStarWpn: fourStarWpn,
                max4Star: max4Star,
                avg5Star: avg5Star,
                avg4Star: avg4Star,
                avgUP: avgUP,
                minPit: minPit,
                upCost: upCost,
                worstLuck: worstLuck,
                bestLuck: bestLuck,
            },
            pool: pool
        }
    }
}
