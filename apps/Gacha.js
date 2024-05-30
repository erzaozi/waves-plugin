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
                    reg: "^#?(waves|鸣潮)抽卡(统计|分析)([\\s\\S]*)$",
                    fnc: "gachaCount"
                }
            ]
        })
    }

    async gachaCount(e) {
        let message = e.msg.replace(/#?(waves|鸣潮)抽卡(统计|分析)/, "");

        let jsonData = null;

        if (!message) {
            let data = await redis.get(`Yunzai:waves:gacha:${e.user_id}`);
            if (!data) {
                await e.reply(`请在命令后抓包获得的JSON请求体\n(例：#鸣潮抽卡统计{"recordId":"2b798246702...)\n抓包详细步骤请发送[#鸣潮抽卡帮助]`);
                return true;
            } else {
                message = data;
            }
        }

        try {
            jsonData = JSON.parse(message);
        } catch (error) {
            await e.reply("无法转换成JSON格式，请复制完整请求体");
            return true;
        }

        if (!jsonData.playerId || !jsonData.recordId) {
            await e.reply("请求体中缺少playerId或recordId，请复制完整请求体");
            return true;
        }

        await e.reply("正在分析您的抽卡记录，请稍后...");

        const data = {
            "playerId": jsonData.playerId,
            "serverId": jsonData.serverId || "76402e5b20be2c39f095a152090afddc",
            "languageCode": jsonData.languageCode || "zh-Hans",
            "recordId": jsonData.recordId
        }

        const messageData = [];
        for (const [key, value] of Object.entries(CardPoolTypes)) {
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

        await e.reply(Bot.makeForwardMsg([...messageData]));
        await redis.set(`Yunzai:waves:gacha:${e.user_id}`, JSON.stringify(jsonData));
        return true;
    }

    async dataFormat(data, type) {
        const wiki = new Wiki();
        const result = {
            "pool": CardPoolTypes[type],
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
                    const record = await wiki.getRecord(name);
                    return { avatar: record.content.contentUrl, count };
                });

            return (await Promise.all(sortedEntries))
                .sort((a, b) => b.count - a.count);
        }

        if (fiveStarIndexes.length > 0) {

            if (fiveStarIndexes[0] !== 0) {
                result["five_star"].push({
                    "avatar": pluginResources + "/gachaCount/imgs/unknow.png",
                    "times": fiveStarIndexes[0],
                    "tags": [`${fiveStarIndexes[0]}抽`, data[0].time],
                    "four_star": await getCount4Star(0, fiveStarIndexes[0])
                });
            }

            const promises = fiveStarIndexes.map(async (index, i) => {
                const startIdx = index + 1;
                const endIdx = (i + 1 < fiveStarIndexes.length) ? fiveStarIndexes[i + 1] : data.length;
                const interval = endIdx - index;
                const record = await wiki.getRecord(data[index].name);
                return {
                    "avatar": record.content.contentUrl,
                    "times": interval,
                    "tags": [`${interval}抽`, interval < 50 ? "欧" : interval < 70 ? "中" : "非", data[index].time, ...((type == 1 || type == 2) && resident.includes(data[index].name) ? ["歪"] : [])],
                    "four_star": await getCount4Star(startIdx, endIdx)
                };
            });
            result["five_star"].push(...await Promise.all(promises));
        } else {
            const interval = data.length;
            result["five_star"].push({
                "avatar": pluginResources + "/gachaCount/imgs/unknow.png",
                "times": interval,
                "tags": [`${interval}抽`, data[0].time],
                "four_star": await getCount4Star(0, data.length)
            });
        }

        return result;
    }
}