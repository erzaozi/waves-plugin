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

    async calaBashData(baseData, calabashData) {
        if (!calabashData.phantomList) {
            calabashData.phantomList = []
        }
        calabashData.phantomList.sort((a, b) => {
            return b.star - a.star
        })
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'calaBash',
            imgType: 'png',
            tplFile: `${pluginResources}/calaBash/calaBash.html`,
            pluginResources,
            baseData,
            calabashData,
        })

        return base64
    }

    async exploreData(baseData, exploreData) {
        exploreData = [exploreData]

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'exploreIndex',
            imgType: 'png',
            tplFile: `${pluginResources}/exploreIndex/exploreIndex.html`,
            pluginResources,
            baseData,
            exploreData,
        })

        return base64
    }

    async signInData(signInData) {
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'signIn',
            imgType: 'png',
            tplFile: `${pluginResources}/signIn/signIn.html`,
            pluginResources,
            signInData
        })

        return base64
    }

    async gachaCount(GachaData) {
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'gachaCount',
            imgType: 'png',
            tplFile: `${pluginResources}/gachaCount/gachaCount.html`,
            pluginResources,
            GachaData
        })

        return base64
    }
}

export default new Render()