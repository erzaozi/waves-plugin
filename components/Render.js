import Version from './Version.js'
import Config from './Config.js'
import { pluginRoot, pluginResources } from '../model/path.js'
import fs from 'fs'

function getScale(pct = null) {
    pct = pct || (Config.getConfig().render_scale / 100)
    pct = Math.min(2, Math.max(0.5, pct))
    return `style=transform:scale(${pct});`
}

const time = {}
function getsaveId(name) {
    if (!time[name]) time[name] = 0;

    time[name]++;

    if (time[name] === 1) {
        setTimeout(() => {
            time[name] = 0;
        }, 10000);
    }

    return `${name}_${time[name]}`;
}

const Render = {
    async render(path, params, cfg) {
        let { e } = cfg
        if (!e.runtime) {
            logger.error('未找到e.runtime，请升级至最新版Yunzai')
        }

        let BotName = Version.isMiao ? 'Miao-Yunzai' : Version.isTrss ? 'TRSS-Yunzai' : 'Yunzai-Bot'
        let currentVersion = null
        const package_path = `${pluginRoot}/package.json`
        try {
            const package_json = JSON.parse(fs.readFileSync(package_path, 'utf-8'))
            if (package_json.version) {
                currentVersion = package_json.version
            }
        } catch (err) {
            logger.error('读取package.json失败', err)
        }
        return e.runtime.render('waves-plugin', path, params, {
            retType: cfg.retType || (cfg.retMsgId ? 'msgId' : 'default'),
            beforeRender({ data }) {
                let pluginName = ''
                if (data.pluginName !== false) {
                    pluginName = ` & ${data.pluginName || 'waves-plugin'}`
                    if (data.pluginVersion !== false) {
                        pluginName += `<span class="version">${currentVersion}</span>`
                    }
                }
                let resPath = data.pluResPath
                const layoutPath = process.cwd() + '/plugins/waves-plugin/resources/common/layout/'
                return {
                    ...data,
                    pluginResources,
                    _res_path: resPath,
                    _layout_path: layoutPath,
                    defaultLayout: layoutPath + 'default.html',
                    elemLayout: layoutPath + 'elem.html',
                    sys: {
                        scale: getScale(cfg.scale)
                    },
                    saveId: getsaveId(data.saveId),
                    copyright: `Created By ${BotName}<span class="version">${Version.yunzai}</span>${pluginName}`,
                }
            }
        })
    }
}

export default Render