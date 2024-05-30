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
          component: "Divider",
          label: "Waves 推送配置",
          componentProps: {
            orientation: "left",
            plain: true,
          },
        },
        {
          field: "waves_auto_signin_lists",
          label: "自动签到配置",
          bottomHelpMessage: "自动签到列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "push_bot",
                label: "签到使用的机器人",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人账号ID',
                },
              },
              {
                field: "push_group",
                label: "签到失败通知群",
                component: "Input",
                required: false,
                componentProps: {
                  placeholder: '请输入群号，不填默认私聊',
                },
              },
              {
                field: "push_user",
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
          field: "waves_auto_push_lists",
          label: "理智值推送配置",
          bottomHelpMessage: "理智推送列表",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "push_bot",
                label: "推送使用的机器人",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入机器人账号ID',
                },
              },
              {
                field: "push_group",
                label: "理智值推送群",
                component: "Input",
                required: false,
                componentProps: {
                  placeholder: '请输入群号，不填默认私聊',
                },
              },
              {
                field: "push_user",
                label: "理智值推送用户",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: '请输入用户账号ID',
                },
              },
            ],
          },
        },
      ],
      getConfigData() {
        let config = Config.getConfig()
        config["waves_auto_signin_lists"] = [];
        config["waves_auto_signin_list"].forEach(user => {
          config["waves_auto_signin_lists"].push({ push_bot: user.split(":")[0], push_group: user.split(":")[1], push_user: user.split(":")[2] });
        });
        config["waves_auto_push_lists"] = [];
        config["waves_auto_push_list"].forEach(user => {
          config["waves_auto_push_lists"].push({ push_bot: user.split(":")[0], push_group: user.split(":")[1], push_user: user.split(":")[2] });
        })
        return config
      },

      setConfigData(data, { Result }) {
        let config = {};
        for (let [keyPath, value] of Object.entries(data)) {
          lodash.set(config, keyPath, value);
        }
        config = lodash.merge({}, Config.getConfig(), config);

        config["waves_auto_signin_list"] = [];
        config["waves_auto_signin_lists"].forEach(({ push_bot, push_group, push_user }) => {
          config["waves_auto_signin_list"].push(`${push_bot}:${push_group || "undefined"}:${push_user}`);
        });
        delete config["waves_auto_signin_lists"];

        config["waves_auto_push_list"] = [];
        config["waves_auto_push_lists"].forEach(({ push_bot, push_group, push_user }) => {
          config["waves_auto_push_list"].push(`${push_bot}:${push_group || "undefined"}:${push_user}`);
        });
        delete config["waves_auto_push_lists"];

        Config.setConfig(config)
        return Result.ok({}, '保存成功~')
      },
    },
  }
}