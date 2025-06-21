import Config from "./components/Config.js";
import lodash from "lodash";
import path from "path";
import { pluginRoot } from "./model/path.js";

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'waves-plugin',
      title: '鸣潮插件',
      author: ['@CikeyQi', '@erzaozi'],
      authorLink: ['https://github.com/CikeyQi', 'https://github.com/erzaozi'],
      link: 'https://github.com/erzaozi/waves-plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      description: '基于 Yunzai 的鸣潮游戏数据查询插件',
      // 显示图标，此为个性化配置
      // 图标可在 https://icon-sets.iconify.design 这里进行搜索
      icon: 'icon-park:game-ps',
      // 图标颜色，例：#FF0000 或 rgb(255, 0, 0)
      iconColor: '#d19f56',
      // 如果想要显示成图片，也可以填写图标路径（绝对路径）
      iconPath: path.join(pluginRoot, 'resources/readme/girl.png'),
    },
    configInfo: {
      schemas: [
        {
          component: "SOFT_GROUP_BEGIN",
          label: "推送配置"
        },
        {
          field: "user_config.waves_auto_signin_list",
          label: "自动签到配置",
          bottomHelpMessage: "自动签到列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "botId",
                label: "签到使用的机器人",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人账号ID',
                },
              },
              {
                field: "groupId",
                label: "签到失败通知群",
                component: "Input",
                required: false,
                componentProps: {
                  placeholder: '请输入群号，不填默认私聊',
                },
              },
              {
                field: "userId",
                label: "自动签到用户",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入用户账号ID',
                },
              },
            ],
          },
        },
        {
          field: 'config.signin_time',
          label: '定时表达式配置',
          bottomHelpMessage: '定时签到',
          component: 'EasyCron',
          componentProps: {
            placeholder: '请输入或选择Cron表达式',
          },
        },
        {
          field: "user_config.waves_auto_task_list",
          label: "自动任务配置",
          bottomHelpMessage: "自动任务列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "botId",
                label: "任务使用的机器人",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人账号ID',
                },
              },
              {
                field: "groupId",
                label: "任务失败通知群",
                component: "Input",
                required: false,
                componentProps: {
                  placeholder: '请输入群号，不填默认私聊',
                },
              },
              {
                field: "userId",
                label: "自动任务用户",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入用户账号ID',
                },
              },
            ],
          },
        },
        {
          field: 'config.task_time',
          label: '定时表达式配置',
          bottomHelpMessage: '定时任务',
          component: 'EasyCron',
          componentProps: {
            placeholder: '请输入或选择Cron表达式',
          },
        },
        {
          field: "user_config.waves_auto_push_list",
          label: "体力推送配置",
          bottomHelpMessage: "体力推送列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "botId",
                label: "推送使用的机器人",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人账号ID',
                },
              },
              {
                field: "groupId",
                label: "体力值推送群",
                component: "Input",
                required: false,
                componentProps: {
                  placeholder: '请输入群号，不填默认私聊',
                },
              },
              {
                field: "userId",
                label: "体力值推送用户",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入用户账号ID',
                },
              },
            ],
          },
        },
        {
          field: 'config.sanity_push_time',
          label: '定时表达式配置',
          bottomHelpMessage: '体力检查频率',
          component: 'EasyCron',
          componentProps: {
            placeholder: '请输入或选择Cron表达式',
          },
        },
        {
          field: "user_config.waves_auto_news_lists",
          label: "公告推送配置",
          bottomHelpMessage: "公告推送列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "botId",
                label: "推送使用的机器人",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人账号ID',
                },
              },
              {
                field: "isGroup",
                label: "是否为群号",
                bottomHelpMessage: "打开后请在下方输入群号，关闭请在下方输入用户账号",
                component: "Switch",
              },
              {
                field: "pushId",
                label: "公告推送ID",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入ID',
                },
              },
            ],
          },
        },
        {
          field: 'config.news_push_time',
          label: '定时表达式配置',
          bottomHelpMessage: '公告检查频率',
          component: 'EasyCron',
          componentProps: {
            placeholder: '请输入或选择Cron表达式',
          },
        },
        {
          component: "SOFT_GROUP_BEGIN",
          label: "登录配置"
        },
        {
          field: "config.allow_login",
          label: "允许网页登录",
          bottomHelpMessage: "是否允许网页登录",
          component: "Switch",
        },
        {
          field: "config.server_port",
          label: "开放端口",
          bottomHelpMessage: "登录HTTP服务器开放端口",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: '请输入端口',
            min: 1,
            max: 65535,
            step: 1,
          },
        },
        {
          field: "config.public_link",
          label: "登录服务公开地址",
          bottomHelpMessage: "展示给用户的自定义登录地址",
          component: "Input",
          required: true,
          componentProps: {
            placeholder: '请输入服务地址，例：http://39.156.66.10:25088',
          },
        },
        {
          field: "config.background_api",
          label: "登录页背景图",
          bottomHelpMessage: "背景图API地址",
          component: "Input",
          required: true,
          componentProps: {
            placeholder: '请输入API地址，例：https://www.loliapi.com/acg',
          },
        },
        {
          component: "SOFT_GROUP_BEGIN",
          label: "面板图配置"
        },
        {
          field: "config.allow_img_upload",
          label: "上传面板图",
          bottomHelpMessage: "是否允许普通用户上传面板图",
          component: "Switch",
        },
        {
          field: "config.allow_get_origin",
          label: "获取原图",
          bottomHelpMessage: "是否允许普通用户获取原图",
          component: "Switch",
        },
        {
          field: "config.allow_get_list",
          label: "获取面板图列表",
          bottomHelpMessage: "是否允许普通用户获取面板图列表",
          component: "Switch",
        },
        {
          field: "config.allow_img_delete",
          label: "删除面板图",
          bottomHelpMessage: "是否允许普通用户删除面板图",
          component: "Switch",
        },
        {
          component: "SOFT_GROUP_BEGIN",
          label: "别名配置"
        },
        {
          field: "config.allow_set_alias",
          label: "设置别名",
          bottomHelpMessage: "是否允许普通用户设置别名",
          component: "Switch",
        },
        {
          component: "SOFT_GROUP_BEGIN",
          label: "其他配置"
        },
        {
          field: "config.use_public_cookie",
          label: "使用公共Token",
          bottomHelpMessage: "允许未登录用户使用登录用户的Token进行查询",
          component: "Switch",
        },
        {
          field: "config.strategy_provide",
          label: "攻略图提供方",
          bottomHelpMessage: "选择角色攻略图提供方",
          component: "Select",
          componentProps: {
            options: [
              { label: "全部", value: "all" },
              { label: "小沐XMu", value: "XMu" },
              { label: "Moealkyne", value: "moealkyne" },
              { label: "金铃子攻略组", value: "Linn" },
              { label: "丸子", value: "ruozi" }
            ],
          },
        },
        {
          field: "config.allow_import",
          label: "允许导入抽卡记录",
          bottomHelpMessage: "无法验证导入数据真实性，可能存在虚假数据覆盖真实数据情况，请谨慎开启",
          component: "Switch",
        },
        {
          field: "config.signin_interval",
          label: "签到间隔时间",
          bottomHelpMessage: "单位：秒，请勿设置过短，风险自负",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: '请输入间隔时间',
            step: 1,
          },
        },
        {
          field: "config.task_interval",
          label: "任务间隔时间",
          bottomHelpMessage: "单位：秒，请勿设置过短，风险自负",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: '请输入间隔时间',
            step: 1,
          },
        },
        {
          field: "config.enable_log",
          label: "输出成功日志",
          bottomHelpMessage: "输出成功日志，用于调试和向开发者反馈问题",
          component: "Switch",
        },
        {
          field: "config.render_scale",
          label: "图片渲染精度",
          bottomHelpMessage: "图片渲染精度，建议 50-200 ，默认 100",
          component: "InputNumber",
          required: true,
          componentProps: {
            min: 50,
            max: 200,
            placeholder: '请输入渲染精度',
            step: 1
          },
        },
        {
          field: "config.limit",
          label: "接口并发量",
          bottomHelpMessage: "过大的并发将会请求阻塞",
          component: "InputNumber",
          required: true,
          componentProps: {
            placeholder: '请输入并发量',
            step: 1,
          },
        },
        {
          field: "config.proxy_url",
          label: "代理地址",
          bottomHelpMessage: "请求代理地址",
          component: "Input",
          componentProps: {
            placeholder: '请输入代理地址，例：http://127.0.0.1:7897',
          },
        },
        {
          field: "config.reverse_proxy_url",
          label: "反向代理地址",
          bottomHelpMessage: "反向代理地址",
          component: "Input",
          required: true,
          componentProps: {
            placeholder: '请输入反向代理地址，例：https://api.kurobbs.com',
          },
        },
      ],
      getConfigData() {
        let config = Config.getConfig()
        let user_config = Config.getUserConfig()
        user_config["waves_auto_news_lists"] = [];
        user_config["waves_auto_news_list"].forEach(user => {
          const { botId, groupId, userId } = user;
          let isGroup = !!groupId;
          if (isGroup) {
            user_config["waves_auto_news_lists"].push({ botId, isGroup, pushId: groupId });
          } else {
            user_config["waves_auto_news_lists"].push({ botId, isGroup, pushId: userId });
          }
        })
        return { config, user_config }
      },

      setConfigData(data, { Result }) {
        let last = {};
        for (let [keyPath, value] of Object.entries(data)) {
          lodash.set(last, keyPath, value);
        }

        let config = lodash.merge({}, Config.getConfig(), last.config);
        let user_config = lodash.merge({}, Config.getUserConfig(), last.user_config);

        config.public_link = config.public_link.replace(/\/$/, '');

        user_config["waves_auto_news_list"] = [];
        user_config["waves_auto_news_lists"].forEach(({ botId, isGroup, pushId }) => {
          user_config["waves_auto_news_list"].push({ botId, groupId: isGroup ? pushId : "", userId: isGroup ? "" : pushId });
        });
        delete user_config["waves_auto_news_lists"];

        Config.setConfig(config)
        Config.setUserConfig(user_config)
        return Result.ok({}, '保存成功~')
      },
    },
  }
}