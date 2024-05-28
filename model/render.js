import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import { pluginResources } from './path.js'

class Render {
    constructor() {
    }

    async User(baseData, roleData) {
        roleData.roleList.sort((a, b) => {
            return b.starLevel - a.starLevel
        })
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'User',
            imgType: 'png',
            tplFile: `${pluginResources}/User/User.html`,
            pluginResources,
            baseData,
            roleData
        })

        return base64
    }
}

export default new Render()