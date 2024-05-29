import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import { pluginResources } from './path.js'

class Render {
    constructor() {
    }

    async userInfo(baseData, roleData) {
        roleData.roleList.sort((a, b) => {
            return b.starLevel - a.starLevel
        })
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'userInfo',
            imgType: 'png',
            tplFile: `${pluginResources}/userInfo/userInfo.html`,
            pluginResources,
            baseData,
            roleData
        })

        return base64
    }

    async dailyData(gameData) {
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'dailyData',
            imgType: 'png',
            tplFile: `${pluginResources}/dailyData/dailyData.html`,
            pluginResources,
            gameData
        })

        return base64
    }
}

export default new Render()