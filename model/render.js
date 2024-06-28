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
            tplFile: `${pluginResources}/Template/userInfo/userInfo.html`,
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
            tplFile: `${pluginResources}/Template/dailyData/dailyData.html`,
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
            tplFile: `${pluginResources}/Template/calaBash/calaBash.html`,
            pluginResources,
            baseData,
            calabashData,
        })

        return base64
    }

    async challengeData(baseData, challengeData) {
        const result = [];

        Object.keys(challengeData.challengeInfo).forEach(key => {
            const challenges = challengeData.challengeInfo[key];

            for (let i = challenges.length - 1; i >= 0; i--) {
                if (challenges[i].roles !== null) {
                    result.push(challenges[i]);
                    break;
                }
            }
        });

        for (let i = 0; i < result.length; i++) {
            const passTime = result[i].passTime;
            const hours = Math.floor(passTime / 3600);
            const minutes = Math.floor((passTime % 3600) / 60);
            const seconds = passTime % 60;
            result[i].passTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'challengeDetails',
            imgType: 'png',
            tplFile: `${pluginResources}/Template/challengeDetails/challengeDetails.html`,
            pluginResources,
            baseData,
            challengeData: result,
        })

        return base64
    }

    async exploreData(baseData, exploreData) {
        exploreData = [exploreData]

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'exploreIndex',
            imgType: 'png',
            tplFile: `${pluginResources}/Template/exploreIndex/exploreIndex.html`,
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
            tplFile: `${pluginResources}/Template/signIn/signIn.html`,
            pluginResources,
            signInData
        })

        return base64
    }

    async gachaCount(GachaData) {
        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'gachaCount',
            imgType: 'png',
            tplFile: `${pluginResources}/Template/gachaCount/gachaCount.html`,
            pluginResources,
            GachaData
        })

        return base64
    }

    async simulatorGacha(gachaData) {

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'simulatorGacha',
            imgType: 'png',
            tplFile: `${pluginResources}/Template/simulatorGacha/simulatorGacha.html`,
            pluginResources,
            gachaData
        })

        return base64
    }

    async wikiRole(data) {
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

        if (!data.content.modules[0].components[0].role.figures[2]) {
            data.content.modules[0].components[0].role.figures[2] = data.content.modules[0].components[0].role.figures[1]
        }

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'wikiRole',
            imgType: 'png',
            tplFile: `${pluginResources}/Wiki/role/role.html`,
            pluginResources,
            data
        })

        return base64
    }

    async wikiWeapon(data) {
        function replace(str) {
            return str.replace(/\\"/g, '"').replace(/\\n/g, '')
        }

        data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)
        data.content.modules[0].components[1].content = replace(data.content.modules[0].components[1].content)
        data.content.modules[0].components[2].content = replace(data.content.modules[0].components[2].content)
        data.content.modules[1].components[0].content = replace(data.content.modules[1].components[0].content)

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'wikiWeapon',
            imgType: 'png',
            tplFile: `${pluginResources}/Wiki/weapon/weapon.html`,
            pluginResources,
            data
        })

        return base64
    }

    async wikiRelics(data) {
        function replace(str) {
            return str.replace(/\\"/g, '"').replace(/\\n/g, '')
        }

        data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)
        data.content.modules[1].components[0].content = replace(data.content.modules[1].components[0].content)
        data.content.modules[0].components[1].content = replace(data.content.modules[0].components[1].content)

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'wikiRelics',
            imgType: 'png',
            tplFile: `${pluginResources}/Wiki/relics/relics.html`,
            pluginResources,
            data
        })

        return base64
    }

    async wikiEnemy(data) {
        function replace(str) {
            return str.replace(/\\"/g, '"').replace(/\\n/g, '')
        }

        data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)
        data.content.modules[0].components[1].tabs[0].content = replace(data.content.modules[0].components[1].tabs[0].content)

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'wikiEnemy',
            imgType: 'png',
            tplFile: `${pluginResources}/Wiki/enemy/enemy.html`,
            pluginResources,
            data
        })

        return base64
    }

    async wikiProps(data) {
        function replace(str) {
            return str.replace(/\\"/g, '"').replace(/\\n/g, '')
        }

        data.content.modules[0].components[0].content = replace(data.content.modules[0].components[0].content)

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'wikiProps',
            imgType: 'png',
            tplFile: `${pluginResources}/Wiki/props/props.html`,
            pluginResources,
            data
        })

        return base64
    }

    async wikiSearch(data) {

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'wikiSearch',
            imgType: 'png',
            tplFile: `${pluginResources}/Wiki/search/search.html`,
            pluginResources,
            data
        })

        return base64
    }

    async charProfile(data) {

        const base64 = await puppeteer.screenshot('waves-plugin', {
            saveId: 'charProfile',
            imgType: 'png',
            tplFile: `${pluginResources}/Template/charProfile/charProfile.html`,
            pluginResources,
            data
        })

        return base64
    }
}

export default new Render()
