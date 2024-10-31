import plugin from '../../../lib/plugins/plugin.js'
import Wiki from '../components/Wiki.js';
import Render from '../components/Render.js';

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
                    reg: "^(?:～|~|鸣潮)?(.*)图鉴$",
                    fnc: "guide"
                }
            ]
        })
    }

    async guide(e) {

        let [, message] = e.msg.match(this.rule[0].reg)

        if (!message) return e.reply('请输入正确的命令格式，如：[~吟霖图鉴]')

        const wiki = new Wiki()

        if (/^(～|~|鸣潮)/.test(e.msg)) {
            let typeList = await wiki.getTypeList(message)
            if (typeList.status) {
                let imageCard = await Render.render('Wiki/search/search', {
                    data: typeList.data,
                }, { e, retType: 'base64' })

                await e.reply(imageCard)
                return true
            }
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
            if (/^(～|~|鸣潮)/.test(e.msg)) {
                logger.info(`[Waves-Plugin] 尝试搜索图鉴：${message}`)
                let result = await wiki.search(message)
                if (!result.status) {
                    logger.warn(`[Waves-Plugin] 未能搜索到图鉴内容：${message}`)
                    await e.reply(`未能获取到${message}的图鉴，请检查输入是否正确`)
                    return false
                } else {
                    let imageCard = await await Render.render('Wiki/search/search', {
                        data: result.data,
                    }, { e, retType: 'base64' })

                    await e.reply([`未能获取到${message}的图鉴，你是指以下内容吗？`, imageCard])
                }
            }
            return false
        }

        let imageCard

        switch (entryData.type) {
            case "1105":
                imageCard = this.renderHandler.wikiRole(entryData.record)
                await e.reply(imageCard)
                break
            case "1106":
                imageCard = this.renderHandler.wikiWeapon(entryData.record)
                await e.reply(imageCard)
                break
            case "1107":
                imageCard = this.renderHandler.wikiRelics(entryData.record)
                await e.reply(imageCard)
                break
            // 合鸣效果
            case "1219":
                await e.reply([segment.image((await wiki.getRecord(name)).record.content.contentUrl), `暂时还没有合鸣效果：${message}的图鉴`])
                break
            case "1158":
                imageCard = this.renderHandler.wikiEnemy(entryData.record)
                await e.reply(imageCard)
                break
            case "1264":
                imageCard = this.renderHandler.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1265":
                imageCard = this.renderHandler.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1217":
                imageCard = this.renderHandler.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1161":
                imageCard = this.renderHandler.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1218":
                imageCard = this.renderHandler.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            case "1223":
                imageCard = this.renderHandler.wikiProps(entryData.record)
                await e.reply(imageCard)
                break
            default:
                return false
        }
        return true
    }

    renderHandler = {
        wikiRole: async (data) => {
            function replace(str) {
                return str.replace(/\\"/g, '"').replace(/\\n/g, '')
            }

            data.content.modules[1].components[1].content = replace(data.content.modules[1].components[1].content)
            data.content.modules[1].components[2].tabs[5].content = replace(data.content.modules[1].components[2].tabs[5].content)
            data.content.modules[1].components[3].tabs[4].content = replace(data.content.modules[1].components[3].tabs[4].content)
            data.content.modules[1].components[0].tabs[0].content = replace(data.content.modules[1].components[0].tabs[0].content)
            data.content.modules[1].components[0].tabs[1].content = replace(data.content.modules[1].components[0].tabs[1].content)
            data.content.modules[1].components[0].tabs[2].content = replace(data.content.modules[1].components[0].tabs[2].content)
            data.content.modules[1].components[0].tabs[3].content = replace(data.content.modules[1].components[0].tabs[3].content)
            data.content.modules[1].components[0].tabs[4].content = replace(data.content.modules[1].components[0].tabs[4].content)
            data.content.modules[1].components[0].tabs[5].content = replace(data.content.modules[1].components[0].tabs[5].content)

            const base64 = await Render.render('Wiki/role/role', {
                data,
            }, { e: this.e, retType: 'base64' });

            return base64
        },

        wikiWeapon: async (data) => {
            function replace(str) {
                return str.replace(/\\"/g, '"').replace(/\\n/g, '')
            }

            data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)
            data.content.modules[0].components[1].content = replace(data.content.modules[0].components[1].content)
            data.content.modules[0].components[2].content = replace(data.content.modules[0].components[2].content)
            data.content.modules[1].components[0].content = replace(data.content.modules[1].components[0].content)

            const base64 = await Render.render('Wiki/weapon/weapon', {
                data,
            }, { e: this.e, retType: 'base64' });

            return base64
        },

        wikiRelics: async (data) => {
            function replace(str) {
                return str.replace(/\\"/g, '"').replace(/\\n/g, '')
            }

            data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)
            data.content.modules[1].components[0].content = replace(data.content.modules[1].components[0].content)
            data.content.modules[0].components[1].content = replace(data.content.modules[0].components[1].content)

            const base64 = await Render.render('Wiki/relics/relics', {
                data,
            }, { e: this.e, retType: 'base64' });

            return base64
        },

        wikiEnemy: async (data) => {
            function replace(str) {
                return str.replace(/\\"/g, '"').replace(/\\n/g, '')
            }

            data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)
            data.content.modules[0].components[1].tabs[0].content = replace(data.content.modules[0].components[1].tabs[0].content)

            const base64 = await Render.render('Wiki/enemy/enemy', {
                data,
            }, { e: this.e, retType: 'base64' });

            return base64
        },

        wikiProps: async (data) => {
            function replace(str) {
                return str.replace(/\\"/g, '"').replace(/\\n/g, '')
            }

            data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)

            const base64 = Render.render('Wiki/props/props', {
                data,
            }, { e: this.e, retType: 'base64' });

            return base64
        }
    }
}
