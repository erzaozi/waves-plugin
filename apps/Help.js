import plugin from '../../../lib/plugins/plugin.js';
import Render from '../components/Render.js';
import { style } from '../resources/help/imgs/config.js';
import Config from '../components/Config.js';
import _ from 'lodash';

export class Help extends plugin {
    constructor() {
        super({
            name: "鸣潮-帮助",
            event: "message",
            priority: 1008,
            rule: [
                {
                    reg: "^(～|~|鸣潮)帮助$",
                    fnc: "help"
                },
                {
                    reg: "^(～|~|鸣潮)(登录|登陆)帮助$",
                    fnc: "bindHelp"
                },
                {
                    reg: "^(～|~|鸣潮)(抽卡统计|抽卡|统计)帮助$",
                    fnc: "gachaHelp"
                }
            ]
        })
    }

    async help(e) {
        const helpCfg = {
            "themeSet": false,
            "title": "WAVES-PLUGIN 帮助",
            "subTitle": "WAVES-PLUGIN HELP",
            "colWidth": 265,
            "theme": "all",
            "themeExclude": [
                "default"
            ],
            "colCount": 3,
            "bgBlur": true
        }
        const helpList = [
            {
                "group": "功能列表",
                "list": [
                    {
                        "icon": 4,
                        "title": "~绑定",
                        "desc": "绑定特征码"
                    },
                    {
                        "icon": 7,
                        "title": "~登录",
                        "desc": "登录库街区账号"
                    },
                    {
                        "icon": 8,
                        "title": "~登录帮助",
                        "desc": "获取登录账号教程"
                    },
                    {
                        "icon": 10,
                        "title": "~解绑",
                        "desc": "解绑登录账号"
                    },
                    {
                        "icon": 21,
                        "title": "~库街区Token",
                        "desc": "查看已登录账号Token"
                    },
                    {
                        "icon": 20,
                        "title": "~签到",
                        "desc": "库街区签到"
                    },
                    {
                        "icon": 22,
                        "title": "~签到记录",
                        "desc": "库街区签到记录"
                    },
                    {
                        "icon": 16,
                        "title": "~每日任务",
                        "desc": "库街区每日任务"
                    },
                    {
                        "icon": 11,
                        "title": "~任务列表",
                        "desc": "查看每日任务状态"
                    },
                    {
                        "icon": 50,
                        "title": "~体力",
                        "desc": "查看日常数据"
                    },
                    {
                        "icon": 53,
                        "title": "~卡片",
                        "desc": "查看账号卡片"
                    },
                    {
                        "icon": 51,
                        "title": "~数据坞",
                        "desc": "查看数据坞信息"
                    },
                    {
                        "icon": 57,
                        "title": "~全息战略",
                        "desc": "查看全息战略挑战信息"
                    },
                    {
                        "icon": 60,
                        "title": "~深境区",
                        "desc": "查看逆境深塔挑战信息"
                    },
                    {
                        "icon": 67,
                        "title": "~探索度",
                        "desc": "查看地图探索度"
                    },
                    {
                        "icon": 64,
                        "title": "~练度统计",
                        "desc": "查看所有角色练度"
                    },
                    {
                        "icon": 35,
                        "title": "~开启自动签到",
                        "desc": "每天自动社区签到"
                    },
                    {
                        "icon": 26,
                        "title": "~开启自动任务",
                        "desc": "每天自动社区任务"
                    },
                    {
                        "icon": 37,
                        "title": "~开启体力推送",
                        "desc": "结晶波片恢复提醒"
                    },
                    {
                        "icon": 40,
                        "title": "~体力阈值",
                        "desc": "设置体力阈值"
                    },
                    {
                        "icon": 69,
                        "title": "~抽卡记录",
                        "desc": "查看抽卡记录"
                    },
                    {
                        "icon": 76,
                        "title": "~导入/导出抽卡记录",
                        "desc": "导入导出抽卡记录"
                    },
                    {
                        "icon": 77,
                        "title": "~抽卡帮助",
                        "desc": "获取抽卡记录教程"
                    },
                    {
                        "icon": 18,
                        "title": "~安可面板",
                        "desc": "查看角色面板"
                    },
                    {
                        "icon": 90,
                        "title": "~吟霖图鉴",
                        "desc": "万物图鉴"
                    },
                    {
                        "icon": 95,
                        "title": "~今汐攻略",
                        "desc": "查看角色攻略"
                    },
                    {
                        "icon": 85,
                        "title": "~公告",
                        "desc": "查看最新官方公告"
                    },
                    {
                        "icon": 59,
                        "title": "~日历",
                        "desc": "查看活动日历"
                    },
                    {
                        "icon": 63,
                        "title": "~开启公告推送",
                        "desc": "推送官方公告"
                    },
                    {
                        "icon": 71,
                        "title": "~十连",
                        "desc": "抽卡模拟器"
                    },
                    {
                        "icon": 72,
                        "title": "~帮助",
                        "desc": "查看帮助面板"
                    }
                ],
            },
        ]

        if (e.isMaster) {
            helpList[0].list.push({
                "icon": 12,
                "title": "~更新",
                "desc": "更新插件"
            })
        }

        if (e.isMaster || Config.getConfig()?.allow_img_upload) {
            helpList.push({
                "group": "面板图管理",
                "list": [

                    {
                        "icon": 86,
                        "title": "~上传今汐面板图",
                        "desc": "上传面板图"
                    },
                    {
                        "icon": 87,
                        "title": "~原图",
                        "desc": "获取面板图"
                    },
                    {
                        "icon": 93,
                        "title": "~今汐面板图列表",
                        "desc": "查看该角色全部面板图"
                    },
                    {
                        "icon": 96,
                        "title": "~删除今汐面板图1",
                        "desc": "删除面板图"
                    }
                ],
            })
        }

        if (e.isMaster || Config.getConfig()?.allow_set_alias) {
            helpList.push({
                "group": "别名管理",
                "list": [

                    {
                        "icon": 41,
                        "title": "~添加炽霞别名马小芳",
                        "desc": "添加别名"
                    },
                    {
                        "icon": 45,
                        "title": "~炽霞别名",
                        "desc": "获取别名列表"
                    },
                    {
                        "icon": 46,
                        "title": "~删除炽霞别名马小芳",
                        "desc": "删除别名"
                    }
                ],
            })
        }

        if (e.isMaster) {
            helpList.push({
                "group": "用户管理",
                "list": [
                    {
                        "icon": 30,
                        "title": "~全部签到",
                        "desc": "批量执行所有账号签到"
                    },
                    {
                        "icon": 36,
                        "title": "~全部每日任务",
                        "desc": "批量执行所有账号任务"
                    },
                    {
                        "icon": 31,
                        "title": "~用户统计",
                        "desc": "查看用户数量统计"
                    },
                    {
                        "icon": 39,
                        "title": "~删除失效用户",
                        "desc": "删除失效的Token"
                    }
                ]
            })
        }

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
            { message: '1.手机下载库街区APP（下载地址：https://www.kurobbs.com/download.html）' },
            { message: '2.首次使用请先登录库街区APP，并检查数据终端中各项数据是否开启对外展示开关' },
            { message: '3.退出库街区登录，再次获取验证码（此时不要登录库街区APP）' },
            { message: '4.发送 ~登录<手机号>:<验证码> 即可完成登录(例：~登录17041039503:1865)，注意：手机号验证码之间有冒号间隔' },
            { message: '机器人可以和库街区APP一起使用，互不干扰，但是在网页登录库街区账号会导致机器人Token失效' },
        ]
        await e.reply(Bot.makeForwardMsg(helpStep))
        return true
    }

    async gachaHelp(e) {
        const helpStep = [
            { message: '一、Android 手机方法\n\n1.进入游戏，打开唤取界面\n\n2.关闭网络\n\n3.点击唤取记录\n\n4.长按左上角空白处，全选，复制\n\n5.向机器人发送[~抽卡统计 + 你复制的内容]，即可开始分析' },
            { message: '二、IOS 手机方法\n\n1.在 AppStore 搜索 Stream 并下载安装\n\n2.打开 Stream，按照提示配置好权限并开启 HTTPS 抓包。在 Stream 中点击 开始抓包 > 安装证书 > 在弹出的窗口中选择允许 > 证书已经下载到了你的设备中，然后打开系统设置 > 通用 > VPN与设备管理 > 选择 Stream Generated CA 并安装。打开系统设置 > 通用 > 关于本机 > (最下方)证书信任设置 > 打开 Stream Generated CA 开关即可\n\n3.在 Stream 中点击开始抓包，回到游戏中点击唤取记录\n\n4.回到 Stream 并点击停止抓包，点击抓包历史 > 选择最新的记录 > 找到链接为 https://gmserver-api.aki-game2.com/gacha/record/query 的POST请求点进去 > 点击位于总览右侧的请求标签页 > 点击最下方查看JSON > 全选复制\n\n5.向机器人发送[~抽卡统计 + 你复制的内容]，即可开始分析' },
            { message: '三、PC端方法\n\n1.进入游戏，打开唤取界面，点击唤取记录\n\n2.右键鸣潮图标，选择打开文件所在位置\n\n2.依次打开目录 Wuthering Waves Game\/Client\/Saved\/Logs 找到 Client.log 文件\n\n3.使用文本编辑器打开，搜索 https://aki-gm-resources.aki-game.com/aki/gacha/index.html 找到位置\n\n4.复制链接以及跟随后面的参数（有换行请仔细查看不要漏掉）\n\n5.向机器人发送[~抽卡统计 + 你复制的内容]，即可开始分析' },
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
            main: `${resPath}/bg.jpg`,
            bg: `${resPath}/bg.jpg`,
            style: style
        }
        let themeStyle = theme.style || {}
        let ret = [`
          body{background-image:url(${theme.bg}) no-repeat;width:${width}px;}
          .container{background-image:url(${theme.main});background-size:cover;}
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
