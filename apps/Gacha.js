import plugin from '../../../lib/plugins/plugin.js'
import { pluginRoot, _path } from '../model/path.js'
import Config from "../components/Config.js";
import Waves from "../components/Code.js";
import Wiki from "../components/Wiki.js";
import Render from '../components/Render.js';
import fs from 'fs';

const resident = ["鉴心", "卡卡罗", "安可", "维里奈", "凌阳"]

export class Gacha extends plugin {
    constructor() {
        super({
            name: "鸣潮-抽卡统计",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)(?:常驻)?(?:角色|武器|武器常驻|自选|新手)?抽卡(?:统计|分析|记录)([\\s\\S]*)$",
                    fnc: "gachaCount"
                },
                {
                    reg: "^(～|~|鸣潮)导入抽卡记录$",
                    fnc: "importGacha"
                },
                {
                    reg: "^(～|~|鸣潮)导出抽卡记录$",
                    fnc: "exportGacha"
                }
            ]
        })
    }

    async gachaCount(e) {

        let [, message] = e.msg.match(this.rule[0].reg);

        const poolMapping = {
            "角色": 1,
            "武器": 2,
            "常驻角色": 3,
            "常驻武器": 4,
            "新手": 5,
            "自选": 6
        };

        const poolType = Object.entries(poolMapping).reduce((type, [key, value]) => e.msg.includes(key) ? value : type, 0);

        const boundId = await redis.get(`Yunzai:waves:gachaHistory:${e.user_id}`);
        const filePath = `${_path}/data/wavesGacha/${boundId}_Export.json`;

        if (boundId && fs.existsSync(filePath) && !message) {

            let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            await e.reply(`正在获取UID为 ${data.info.uid} 于 ${new Date(data.info.export_timestamp).toLocaleString()} 的抽卡记录，请稍候...`);

            let renderData = { playerId: data.info.uid };

            const getPoolData = async (gachaId) =>
                this.dataFormat(await this.convertData(data.list.filter(item => item.gacha_id == gachaId), false));

            if (poolType === 0) {
                renderData = {
                    ...renderData,
                    upCharPool: await getPoolData(1),
                    upWpnPool: await getPoolData(2),
                    stdCharPool: await getPoolData(3),
                    stdWpnPool: await getPoolData(4)
                };
            } else if (poolType > 0) {
                const key = poolType === 5 ? 'otherPool' : poolType === 6 ? 'upCharPool' : poolType === 1 ? 'upCharPool' : poolType === 2 ? 'upWpnPool' : poolType === 3 ? 'stdCharPool' : 'stdWpnPool';
                renderData = { ...renderData, [key]: await getPoolData(poolType) };
            }

            let imageCard = await Render.render('Template/gacha/gacha', {
                data: renderData,
            }, { e, retType: 'base64' });

            await e.reply(imageCard);
            return true;
        }

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

        await e.reply(`正在分析UID为 ${jsonData.playerId} 的抽卡记录，请稍候...`);

        const data = {
            playerId: jsonData.playerId,
            serverId: jsonData.serverId || "76402e5b20be2c39f095a152090afddc",
            languageCode: jsonData.languageCode || "zh-Hans",
            recordId: jsonData.recordId
        };

        const waves = new Waves();
        const getCardPool = async (poolId, poolType) =>
            await waves.getGaCha({ ...data, cardPoolId: poolId, cardPoolType: poolType });

        const pools = await Promise.all([
            getCardPool("1", "1"),
            getCardPool("2", "2"),
            getCardPool("3", "3"),
            getCardPool("4", "4"),
            getCardPool("5", "5"),
            getCardPool("6", "6"),
            getCardPool("7", "7"),
        ]);

        const failedPool = pools.find(pool => !pool.status);
        if (failedPool) {
            await e.reply("获取抽卡记录失败：" + failedPool.msg);
            return true;
        }

        const poolDataMapping = {
            0: {
                upCharPool: await this.dataFormat(pools[0].data),
                upWpnPool: await this.dataFormat(pools[1].data),
                stdCharPool: await this.dataFormat(pools[2].data),
                stdWpnPool: await this.dataFormat(pools[3].data)
            },
            1: { upCharPool: await this.dataFormat(pools[0].data) },
            2: { upWpnPool: await this.dataFormat(pools[1].data) },
            3: { stdCharPool: await this.dataFormat(pools[2].data) },
            4: { stdWpnPool: await this.dataFormat(pools[3].data) },
            5: { otherPool: await this.dataFormat(pools[4].data) },
            6: { upCharPool: await this.dataFormat(pools[5].data) },
        };

        const selectedPools = poolDataMapping[poolType] || {};
        const renderData = {
            playerId: jsonData.playerId,
            ...selectedPools
        };

        let imageCard = await Render.render('Template/gacha/gacha', {
            data: renderData,
        }, { e, retType: 'base64' });

        await e.reply(imageCard);

        await redis.set(`Yunzai:waves:gachaHistory:${e.user_id}`, jsonData.playerId);

        const json = {
            info: {
                lang: "zh-cn",
                region_time_zone: 8,
                export_timestamp: Date.now(),
                export_app: "Waves-Plugin",
                export_app_version: JSON.parse(fs.readFileSync(`${pluginRoot}/package.json`, 'utf-8')).version,
                wwgf_version: "v0.1b",
                uid: jsonData.playerId
            },
            list: await this.convertData([
                ...pools[0].data,
                ...pools[1].data,
                ...pools[2].data,
                ...pools[3].data,
                ...pools[4].data,
                ...pools[5].data,
                ...pools[6].data
            ], true)
        }

        if (fs.existsSync(`${_path}/data/wavesGacha/${jsonData.playerId}_Export.json`)) {
            const list = JSON.parse(fs.readFileSync(`${_path}/data/wavesGacha/${jsonData.playerId}_Export.json`, 'utf-8')).list;

            const filteredList = Object.values(list.reduce((acc, item) => {
                (acc[item.gacha_id] = acc[item.gacha_id] || []).push(item);
                return acc;
            }, {})).filter(group => group.some(item => json.list.some(newItem => newItem.id === item.id)))
                .flat();

            json.list = [...json.list, ...filteredList].filter((item, index, self) => index === self.findIndex(t => t.id === item.id));

            json.list.sort((a, b) => a.gacha_id - b.gacha_id || b.id - a.id);
        }

        fs.writeFileSync(`${_path}/data/wavesGacha/${jsonData.playerId}_Export.json`, JSON.stringify(json, null, 2));
        logger.info(`[Waves-Plugin] 已写入本地文件 ${jsonData.playerId}_Export.json`)

        return true;
    }


    async importGacha(e) {

        if (!Config.getConfig().allow_import) return await e.reply("当前不允许导入抽卡记录，请使用[~抽卡记录]进行更新");

        if (e.isGroup) return e.reply("请私聊导出抽卡记录")

        this.setContext('readFile');
        await this.reply('请发送Json文件');
    }

    async readFile() {
        this.finish('readFile');

        if (!this.e.file) {
            return await this.e.reply("未获取到Json文件，请再次使用[~导入抽卡记录]导入抽卡记录");
        }

        const path = `${_path}/data/wavesGacha/cache_${this.e.file.name}`;
        const { url, fid } = this.e.file;
        const groupUrl = this.e.group?.getFileUrl ? await this.e.group.getFileUrl(fid) : null;
        const friendUrl = this.e.friend?.getFileUrl ? await this.e.friend.getFileUrl(fid) : null;

        const fileUrl = url || groupUrl || friendUrl;

        if (!fileUrl) {
            return await this.reply("未获取到文件URL，请检查文件是否有效", true);
        }

        try {
            await Bot.download(fileUrl, path);
        } catch (err) {
            logger.error(`文件下载错误：${logger.red(err.stack)}`);
            await this.reply(`导入抽卡记录失败：${err.message || '未知错误'}`, true);
            return true;
        }

        const json = JSON.parse(fs.readFileSync(path, 'utf-8'));

        if (!json || !json.info || !json.list) {
            await this.e.reply("导入抽卡记录失败：文件内容格式错误，请检查文件是否为WWGF标准格式");
            return true;
        }

        const { uid } = json.info;

        if (!uid) {
            await this.e.reply("未能获取到抽卡记录的UID，请检查文件是否为WWGF标准格式");
            return true;
        }

        const exportPath = `${_path}/data/wavesGacha/${uid}_Export.json`;
        if (fs.existsSync(exportPath)) {
            const { list } = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

            const filteredList = Object.values(list.reduce((acc, item) => {
                (acc[item.gacha_id] = acc[item.gacha_id] || []).push(item);
                return acc;
            }, {})).filter(group => group.some(item => json.list.some(newItem => newItem.id === item.id)))
                .flat();

            json.list = [...json.list, ...filteredList].filter((item, index, self) => index === self.findIndex(t => t.id === item.id));

            json.list.sort((a, b) => a.gacha_id - b.gacha_id || b.id - a.id);
        }

        fs.writeFileSync(exportPath, JSON.stringify(json, null, 2));
        fs.unlinkSync(path);

        await this.e.reply(`导入UID为 ${uid} 的抽卡记录成功，共计${json.list.length}条记录`);
        await redis.set(`Yunzai:waves:gachaHistory:${this.e.user_id}`, uid);
        logger.info(`[Waves-Plugin] 已写入本地文件 ${uid}_Export.json`);

        return true;
    }
    async exportGacha(e) {
        const id = await redis.get(`Yunzai:waves:gachaHistory:${e.user_id}`);
        const path = `${_path}/data/wavesGacha/${id}_Export.json`;

        if (id && fs.existsSync(path)) {
            const { list } = JSON.parse(fs.readFileSync(path, 'utf-8'));

            await e.reply(`导出 ${id}_Export.json 成功，共计${list.length}条记录 \n请接收文件`);

            const sendFile = e.group?.sendFile || e.friend?.sendFile;

            if (sendFile) {
                await sendFile.call(e.group || e.friend, path);
            } else {
                await e.reply('导出失败：暂不支持发送文件');
            }
        } else {
            await e.reply("未能找到您在本地的抽卡记录，请发送[~抽卡记录]获取抽卡记录");
        }

        return true;
    }

    // 处理数据
    async dataFormat(array) {
        const no5Star = ((idx => (idx === -1 ? array.length : idx))(array.findIndex(item => item.qualityLevel === 5)));
        const no4Star = ((idx => (idx === -1 ? array.length : idx))(array.findIndex(item => item.qualityLevel === 4)));
        const fiveStar = array.filter(item => item.qualityLevel === 5).length;
        const fourStar = array.filter(item => item.qualityLevel === 4).length;
        const std5Star = array.filter(item => item.qualityLevel === 5 && resident.includes(item.name)).length;
        const fourStarWpn = array.filter(item => item.qualityLevel === 4 && item.resourceType === "武器").length;
        const max4Star = Object.entries(array.filter(item => item.qualityLevel === 4).reduce((acc, item) => (acc[item.name] = (acc[item.name] || 0) + 1, acc), {})).reduce((max, curr) => curr[1] > max[1] ? curr : max, ['无', 0])[0];
        const avg5Star = (fiveStar !== 0) ? Math.round((array.length - no5Star) / fiveStar) : 0;
        const avg4Star = (fourStar !== 0) ? Math.round((array.length - no4Star) / fourStar) : 0;
        const avgUP = (fiveStar - std5Star !== 0) ? Math.round((array.length - no5Star) / (fiveStar - std5Star)) : 0;
        const minPit = ((fiveStar, std5Star) => (fiveStar === std5Star ? 0.0 : ((fiveStar - std5Star * 2) / (fiveStar - std5Star) * 100).toFixed(1)))((resident.includes(array.filter(item => item.qualityLevel === 5)[0]?.name) ? 1 : 0) + fiveStar, std5Star);
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

    // 处理数据
    async convertData(dataArray, toWWGF) {
        const mappings = {
            forward: {
                gacha: {
                    "角色精准调谐": "0001",
                    "武器精准调谐": "0002",
                    "角色调谐（常驻池）": "0003",
                    "武器调谐（常驻池）": "0004",
                    "新手调谐": "0005",
                    "6": "0006",
                    "7": "0007"
                },
                type: {
                    "0001": "角色活动唤取",
                    "0002": "武器活动唤取",
                    "0003": "角色常驻唤取",
                    "0004": "武器常驻唤取",
                    "0005": "新手唤取",
                    "0006": "新手自选唤取",
                    "0007": "新手自选唤取（感恩定向唤取）"
                }
            },
            reverse: {
                "0001": "角色精准调谐",
                "0002": "武器精准调谐",
                "0003": "角色调谐（常驻池）",
                "0004": "武器调谐（常驻池）",
                "0005": "新手调谐",
                "0006": "新手自选唤取",
                "0007": "新手自选唤取（感恩定向唤取）"
            }
        };

        const generateId = (ts, poolId, drawNum) => `${String(ts).padStart(10, '0')}${String(poolId).padStart(4, '0')}000${String(drawNum).padStart(2, '0')}`;

        const timestampCount = {};

        return dataArray.map(item => {
            const ts = Math.floor(new Date(item.time).getTime() / 1000);
            if (toWWGF) {
                const poolId = mappings.forward.gacha[item.cardPoolType];

                timestampCount[ts] = timestampCount[ts] || Math.min(dataArray.filter(record =>
                    Math.floor(new Date(record.time).getTime() / 1000) === ts
                ).length, 10);

                const drawNum = timestampCount[ts]--;
                const uniqueId = generateId(ts, poolId, drawNum);

                return {
                    gacha_id: poolId,
                    gacha_type: mappings.forward.type[poolId],
                    item_id: String(item.resourceId),
                    count: String(item.count),
                    time: item.time,
                    name: item.name,
                    item_type: item.resourceType,
                    rank_type: String(item.qualityLevel),
                    id: uniqueId
                };
            } else {
                return {
                    cardPoolType: mappings.reverse[item.gacha_id],
                    resourceId: Number(item.item_id),
                    qualityLevel: Number(item.rank_type),
                    resourceType: item.item_type,
                    name: item.name,
                    count: Number(item.count),
                    time: item.time
                };
            }
        });
    };
}
