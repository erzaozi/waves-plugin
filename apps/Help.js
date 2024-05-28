import plugin from '../../../lib/plugins/plugin.js';
import { pluginResources } from '../model/path.js'; import Render from '../components/Render.js';
import { style } from '../resources/help/imgs/config.js';
import _ from 'lodash';

export class Help extends plugin {
    constructor() {
        super({
            name: "鸣潮-帮助",
            event: "message",
            priority: 1008,
            rule: [
                {
                    reg: "^#?(waves|鸣潮)帮助$",
                    fnc: "help"
                },
                {
                    reg: "^#?(waves|鸣潮)(登录|登陆|绑定)帮助$",
                    fnc: "bindHelp"
                }
            ]
        })
    }

    async help(e) {
        const helpCfg = {
            "themeSet": false,
            "title": "WAVES-PLUGIN 帮助",
            // "subTitle": "Yunzai-Bot & waves-plugin",
            "subTitle": "WAVES-PLUGIN HELP",
            "colWidth": 265,
            "theme": "all",
            "themeExclude": [
                "default"
            ],
            "colCount": 2,
            "bgBlur": true
        }
        const helpList = [
            {
                "group": "功能列表",
                "list": [
                    {
                        "icon": 1,
                        "title": "#鸣潮登录",
                        "desc": "绑定账户Token"
                    },
                    {
                        "icon": 2,
                        "title": "#鸣潮登录帮助",
                        "desc": "绑定账户Token教程"
                    },
                    {
                        "icon": 3,
                        "title": "#鸣潮解绑",
                        "desc": "解绑账户Token"
                    },
                    {
                        "icon": 4,
                        "title": "#鸣潮开启自动签到",
                        "desc": "每天四点自动执行所有账号签到"
                    },
                    {
                        "icon": 5,
                        "title": "#鸣潮开启波片推送",
                        "desc": "结晶波片回满提醒"
                    },
                    {
                        "icon": 6,
                        "title": "#鸣潮帮助",
                        "desc": "查看帮助面板"
                    },
                    {
                        "icon": 7,
                        "title": "#鸣潮更新",
                        "desc": "更新插件"
                    }
                ],
            },
        ]
        let helpGroup = []
        _.forEach(helpList, (group) => {
            _.forEach(group.list, (help) => {
                let icon = help.icon * 1
                if (!icon) {
                    help.css = 'display:none'
                } else {
                    let x = (icon - 1) % 10
                    let y = (icon - x - 1) / 10
                    help.css = `background-position:-${x * 50}px -${y * 50}px`
                }
            })
            helpGroup.push(group)
        })

        let themeData = await this.getThemeData(helpCfg, helpCfg)
        return await Render.render('help/index', {
            helpCfg,
            helpGroup,
            ...themeData,
            element: 'default'
        }, { e, scale: 1.6 })
    }

    async bindHelp(e) {
        const helpStep = [
            { message: '1.浏览器打开 https://www.kurobbs.com/mc 点击右上角头像' },
            { message: '2.输入手机号，点击 获取验证码 按钮' },
            { message: '3.等待手机收到验证码' },
            { message: '4.发送 #鸣潮登录手机号:验证码 即可完成登录(例：#鸣潮登录17041039503:1865)' },
            { message: '注意：再次在网页或APP登录账号会导致此次登录失效，如果需要与APP共用请自行抓包获取Token，发送 #鸣潮登录Token 即可完成登录(例：#鸣潮登录eyJhbGc...)' }
        ]
        await e.reply(Bot.makeForwardMsg(helpStep))
        return true
    }

    async getThemeData(diyStyle, sysStyle) {
        let resPath = '{{_res_path}}/help/imgs/'
        let helpConfig = _.extend({}, sysStyle, diyStyle)
        let colCount = Math.min(5, Math.max(parseInt(helpConfig?.colCount) || 3, 2))
        let colWidth = Math.min(500, Math.max(100, parseInt(helpConfig?.colWidth) || 265))
        let width = Math.min(2500, Math.max(800, colCount * colWidth + 30))
        let theme = {
            main: `${resPath}/main.png`,
            bg: `${resPath}/bg.jpg`,
            style: style
        }
        let themeStyle = theme.style || {}
        let ret = [`
          body{background-image:url(${theme.bg}) no-repeat;width:${width}px;}
          .container{background-image:url(${theme.main});width:${width}px;}
          .help-table .td,.help-table .th{width:${100 / colCount}%}
          `]
        let css = function (sel, css, key, def, fn) {
            let val = (function () {
                for (let idx in arguments) {
                    if (!_.isUndefined(arguments[idx])) {
                        return arguments[idx]
                    }
                }
            })(themeStyle[key], diyStyle[key], sysStyle[key], def)
            if (fn) {
                val = fn(val)
            }
            ret.push(`${sel}{${css}:${val}}`)
        }
        css('.help-title,.help-group', 'color', 'fontColor', '#ceb78b')
        css('.help-title,.help-group', 'text-shadow', 'fontShadow', 'none')
        css('.help-desc', 'color', 'descColor', '#eee')
        css('.cont-box', 'background', 'contBgColor', 'rgba(43, 52, 61, 0.8)')
        css('.cont-box', 'backdrop-filter', 'contBgBlur', 3, (n) => diyStyle.bgBlur === false ? 'none' : `blur(${n}px)`)
        css('.help-group', 'background', 'headerBgColor', 'rgba(34, 41, 51, .4)')
        css('.help-table .tr:nth-child(odd)', 'background', 'rowBgColor1', 'rgba(34, 41, 51, .2)')
        css('.help-table .tr:nth-child(even)', 'background', 'rowBgColor2', 'rgba(34, 41, 51, .4)')
        return {
            style: `<style>${ret.join('\n')}</style>`,
            colCount
        }
    }
}
