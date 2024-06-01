import plugin from '../../../lib/plugins/plugin.js'
import Wiki from '../components/Wiki.js';
import Render from '../model/render.js'

export class Guide extends plugin {
    constructor() {
        super({
            name: "鸣潮-图鉴",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)?.*图鉴$",
                    fnc: "guide"
                }
            ]
        })
    }

    async guide(e) {

        const match = e.msg.match(/#?(鸣潮)?(.*?)图鉴/);
        if (!match || !match[2]) {
            return false
        }

        const message = match[2]

        const wiki = new Wiki()
        const name = await wiki.getAlias(message)
        const entryData = await wiki.getEntry(name)

        if (!entryData.status) {
            logger.warn(`[Waves-Plugin] 未能获取图鉴内容：${message}`)
            return false
        }

        switch (entryData.type) {
            // 共鸣者
            case "1105":
                const imageCard = await Render.wikiRole(entryData.record)
                await e.reply(imageCard)
                break
            // 武器
            case "1106":
                await e.reply(`暂时还没有武器：${message}的图鉴`)
                break
            // 声骸
            case "1107":
                await e.reply(`暂时还没有声骸：${message}的图鉴`)
                break
            // 合鸣效果
            case "1219":
                await e.reply(`暂时还没有合鸣效果：${message}的图鉴`)
                break
            // 敌人
            case "1158":
                await e.reply(`暂时还没有敌人：${message}的图鉴`)
                break
            // 可合成道具
            case "1264":
                await e.reply(`暂时还没有可合成道具：${message}的图鉴`)
                break
            // 道具合成图纸
            case "1265":
                await e.reply(`暂时还没有道具合成图纸：${message}的图鉴`)
                break
            // 补给
            case "1217":
                await e.reply(`暂时还没有补给：${message}的图鉴`)
                break
            // 资源
            case "1161":
                await e.reply(`暂时还没有资源：${message}的图鉴`)
                break
            // 素材
            case "1218":
                await e.reply(`暂时还没有素材：${message}的图鉴`)
                break
            // 特殊道具
            case "1223":
                await e.reply(`暂时还没有特殊道具：${message}的图鉴`)
                break
            // 默认
            default:
                return false
        }
        return true
    }
}
