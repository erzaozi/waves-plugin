import plugin from '../../../lib/plugins/plugin.js'
import Wiki from '../components/Wiki.js';
import Render from '../model/render.js'

const typeMap = {
    "共鸣者": "1105",
    "武器": "1106",
    "声骸": "1107",
    "合鸣效果": "1219",
    "敌人": "1158",
    "可合成道具": "1264",
    "道具合成图纸": "1265",
    "补给": "1217",
    "资源": "1161",
    "素材": "1218",
    "特殊道具": "1223"
};

export class Guide extends plugin {
    constructor() {
        super({
            name: "鸣潮-图鉴",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)?.*图鉴$",
                    fnc: "guide"
                }
            ]
        })
    }

    async guide(e) {

        const match = e.msg.match(/(～|~|鸣潮)?(.*?)图鉴/);
        if (!match || !match[2]) {
            return false
        }

        let message = match[2]

        const wiki = new Wiki()

        let typeList = await wiki.getTypeList(message)
        if (typeList.status) {
            let imageCard = await Render.wikiSearch(typeList.data)
            await e.reply(imageCard)
            return true
        }

        let type = "";
        for (const key in typeMap) {
            if (message.includes(key)) {
                message = message.replace(key, "")
                type = typeMap[key];
                break;
            }
        }

        const name = await wiki.getAlias(message)
        const entryData = await wiki.getEntry(name, type)

        if (!entryData.status) {
            logger.warn(`[Waves-Plugin] 未能获取图鉴内容：${message}`)
            if (e.msg.startsWith("~") || e.msg.startsWith("～") || e.msg.startsWith("鸣潮")) {
                logger.info(`[Waves-Plugin] 尝试搜索图鉴：${message}`)
                let result = await wiki.search(message)
                if (!result.status) {
                    logger.warn(`[Waves-Plugin] 未能搜索到图鉴内容：${message}`)
                    await e.reply(`未能获取到${message}的图鉴，请检查输入是否正确`)
                    return false
                } else {
                    let imageCard = await Render.wikiSearch(result.data)
                    await e.reply([`未能获取到${message}的图鉴，你是指以下内容吗？`, imageCard])
                }
            }
            return false
        }

        let imageCard

        switch (entryData.type) {
            case "1105":
                imageCard = await Render.wikiRole(entryData.record)
                await e.reply(imageCard)
                break
            case "1106":
                imageCard = await Render.wikiWeapon(entryData.record)
                await e.reply(imageCard)
                break
            case "1107":
                imageCard = await Render.wikiRelics(entryData.record)
                await e.reply(imageCard)
                break
            // 合鸣效果
            case "1219":
                await e.reply([segment.image((await wiki.getRecord(name)).record.content.contentUrl), `暂时还没有合鸣效果：${message}的图鉴`])
                break
            case "1158":
                imageCard = await Render.wikiEnemy(entryData.record)
                await e.reply(imageCard)
                break
            case "1264":
                imageCard = await Render.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1265":
                imageCard = await Render.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1217":
                imageCard = await Render.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1161":
                imageCard = await Render.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1218":
                imageCard = await Render.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1223":
                imageCard = await Render.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            default:
                return false
        }
        return true
    }
}
