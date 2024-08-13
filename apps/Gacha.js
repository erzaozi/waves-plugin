import plugin from '../../../lib/plugins/plugin.js'
import { pluginResources } from '../model/path.js'
import Waves from "../components/Code.js";
import Wiki from "../components/Wiki.js";
import Render from '../model/render.js'

const CardPoolTypes = {
    "1": "角色精准调谐",
    "2": "武器精准调谐",
    "3": "角色调谐（常驻池）",
    "4": "武器调谐（常驻池）",
    "5": "新手调谐",
    "6": "新手自选唤取",
    "7": "新手自选唤取（感恩定向唤取）"
}

const resident = ["鉴心", "卡卡罗", "安可", "维里奈", "凌阳"]

export class Gacha extends plugin {
    constructor() {
        super({
            name: "鸣潮-抽卡统计",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(常驻(武器|角色)|限定(武器|角色))?抽卡(统计|分析|记录)([\\s\\S]*)$",
                    fnc: "gachaCount"
                }
            ]
        })
    }

    async gachaCount(e) {
        let message = e.msg.replace(/^(～|~|鸣潮)(常驻(武器|角色)|限定(武器|角色))?抽卡(统计|分析|记录)/, "");

        let jsonData = {};

        if (!message) {
            let data = await redis.get(`Yunzai:waves:gacha:${e.user_id}`);
            if (!data) {
                await e.reply(`请在命令后面携带请求体或链接\n例：~抽卡统计{"recordId":"2b798246702...\n各平台抽卡记录获取详细步骤请发送[~抽卡帮助]`);
                return true;
            } else {
                message = data;
            }
        }

        if (message.startsWith("{")) {
            try {
                jsonData = JSON.parse(message);
                if (!jsonData.playerId || !jsonData.recordId) {
                    await e.reply("缺少playerId或recordId，请复制完整请求体");
                    return true;
                }
            } catch (error) {
                await e.reply("无法转换成JSON格式，请复制完整请求体");
                return true;
            }
        } else if (message.match(/https?:\/\/[^\s/$.?#].[^\s]*/g)) {
            message = message.match(/https?:\/\/[^\s/$.?#].[^\s]*/g)[0];
            try {
                const parsedUrl = new URL(message);
                const params = parsedUrl.searchParams;
                jsonData.playerId = params.get("player_id");
                jsonData.recordId = params.get("record_id");
                if (!jsonData.playerId || !jsonData.recordId) {
                    await e.reply("缺少player_id或record_id，请复制完整链接");
                    return true;
                }
            } catch (error) {
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

        let cardPool = e.msg.includes("限定角色") ? { "1": "角色精准调谐" } :
            e.msg.includes("限定武器") ? { "2": "武器精准调谐" } :
                e.msg.includes("常驻角色") ? { "3": "角色调谐（常驻池）" } :
                    e.msg.includes("常驻武器") ? { "4": "武器调谐（常驻池）" } :
                        CardPoolTypes;

        const messageData = [];
        for (const [key, value] of Object.entries(cardPool)) {
            data.cardPoolId = key;
            data.cardPoolType = key;

            const waves = new Waves();
            const result = await waves.getGaCha(data);

            if (!result.status) {
                this.e.reply(result.msg)
                return true;
            }

            if (result.data.length === 0) {
                messageData.push({ message: `${value}：未获取到任何抽卡记录` });
            } else {
                const GachaData = await this.dataFormat(result.data, key);
                GachaData.playerId = jsonData.playerId;

                if (result.status) {
                    const imageCard = await Render.gachaCount(GachaData);
                    messageData.push({ message: imageCard });
                } else {
                    messageData.push({ message: `${value}：${result.msg}` });
                }
            }
        }

        await redis.set(`Yunzai:waves:gacha:${e.user_id}`, JSON.stringify(jsonData));

        if (messageData.length === 1) {
            await e.reply(messageData[0].message);
            return true;
        }

        await e.reply(Bot.makeForwardMsg([...messageData]));
        return true;
    }

    async dataFormat(data, type) {
        const wiki = new Wiki();
        const result = {
            "pool": CardPoolTypes[type],
            "total": data.length,
            "five_num": data.filter(item => item.qualityLevel === 5).length,
            "four_num": data.filter(item => item.qualityLevel === 4).length,
            "average": Math.round(((data.findIndex(item => item.qualityLevel === 5) === -1 || data.filter(item => item.qualityLevel === 5).length === 0) ? 0 : (data.length - data.findIndex(item => item.qualityLevel === 5)) / data.filter(item => item.qualityLevel === 5).length) * 160),
            "five_star": []
        };

        const fiveStarIndexes = data
            .map((item, index) => item.qualityLevel === 5 ? index : -1)
            .filter(index => index !== -1);

        async function getCount4Star(startIdx, endIdx) {
            const count4Star = {};
            for (let j = startIdx; j < endIdx; j++) {
                if (data[j].qualityLevel === 4) {
                    count4Star[data[j].name] = (count4Star[data[j].name] || 0) + 1;
                }
            }
            const sortedEntries = Object.entries(count4Star)
                .map(async ([name, count]) => {
                    const recordData = await wiki.getRecord(name);
                    return { avatar: recordData.record.content.contentUrl, count };
                });

            return (await Promise.all(sortedEntries))
                .sort((a, b) => b.count - a.count);
        }

        if (fiveStarIndexes.length > 0) {

            if (fiveStarIndexes[0] !== 0) {
                result["five_star"].push({
                    "avatar": pluginResources + "/Template/gachaCount/imgs/unknow.png",
                    "times": fiveStarIndexes[0],
                    "time": new Date(data[0].time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
                    "four_star": await getCount4Star(0, fiveStarIndexes[0])
                });
            }

            const promises = fiveStarIndexes.map(async (index, i) => {
                const startIdx = index + 1;
                const endIdx = (i + 1 < fiveStarIndexes.length) ? fiveStarIndexes[i + 1] : data.length;
                const interval = endIdx - index;
                const recordData = await wiki.getRecord(data[index].name);
                return {
                    "avatar": recordData.record.content.contentUrl,
                    "times": interval,
                    "time": new Date(data[index].time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
                    "four_star": await getCount4Star(startIdx, endIdx)
                };
            });
            result["five_star"].push(...await Promise.all(promises));
        } else {
            const interval = data.length;
            result["five_star"].push({
                "avatar": pluginResources + "/Template/gachaCount/imgs/unknow.png",
                "times": interval,
                "time": new Date(data[0].time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
                "four_star": await getCount4Star(0, data.length)
            });
        }

        return result;
    }
}
