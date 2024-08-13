![waves-plugin](https://socialify.git.ci/erzaozi/waves-plugin/image?description=1&font=Raleway&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto)

<img decoding="async" align=right src="resources/readme/girl.png" width="35%">

# WAVES-PLUGIN

- 一个适用于 [Yunzai 系列机器人框架](https://github.com/yhArcadia/Yunzai-Bot-plugins-index) 的鸣潮游戏数据查询插件

- 支持手机验证码登录或 Token 登录，支持查询玩家、日常、数据坞、抽卡等游戏数据

- **使用中遇到问题请加 QQ 群咨询：[707331865](https://qm.qq.com/q/TXTIS9KhO2)**

> [!TIP]
> 最近看见群友都在玩潮啊，入坑了几天还算有意思（剧情全跳了）。群里有人建议我搓一个，反正闲的无聊，那就动手搓一个罢。哦对了，你怎么知道我是安可和维里奈双萝莉开局？

## 安装插件

#### 1. 克隆仓库

```
git clone https://github.com/erzaozi/waves-plugin.git ./plugins/waves-plugin
```

> [!NOTE]
> 如果你的网络环境较差，无法连接到 Github，可以使用 [GitHub Proxy](https://mirror.ghproxy.com/) 提供的文件代理加速下载服务
>
> ```
> git clone https://mirror.ghproxy.com/https://github.com/erzaozi/waves-plugin.git ./plugins/waves-plugin
> ```

#### 2. 安装依赖

```
pnpm install --filter=waves-plugin
```

## 插件配置

> [!WARNING]
> 非常不建议手动修改配置文件，本插件已兼容 [Guoba-plugin](https://github.com/guoba-yunzai/guoba-plugin) ，请使用锅巴插件对配置项进行修改

## 功能列表

请使用 `~帮助` 获取完整帮助

- [x] 绑定账号
- [x] 自动签到
- [x] 用户信息查询
- [x] 日常数据查询
- [x] 波片恢满提醒
- [x] 数据坞 / 声骸查询
- [x] 探索度查询
- [x] 挑战数据查询
- [x] 抽卡记录查询分析
- [x] 游戏内所有物品图鉴
- [x] 官方公告推送
- [x] 角色攻略
- [x] 抽卡模拟器
- [x] 随机表情包
- [x] 角色卡片查询

## 功能列表

<details><summary>点击展开</summary>

| 命令      | 功能                       | 示例                                                                                                |
| --------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| ~登录     | 绑定账户 Token             | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Bind.png)      |
| ~卡片     | 获取用户详细信息           | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/User.png)      |
| ~签到     | 库街区签到                 | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/SignIn.png)    |
| ~体力     | 获取用户日常数据卡片       | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Sanity.png)    |
| ~数据坞   | 获取用户数据坞以及声骸信息 | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Calabash.png)  |
| ~探索度   | 获取用户探索度数据卡片     | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Explore.png)   |
| ~全息战略 | 获取用户挑战数据卡片       | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Challenge.png) |
| ~面板     | 获取用户角色面板           | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Panel.png)     |
| ~抽卡记录 | 获取用户抽卡数据卡片       | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Gacha.png)     |
| ~图鉴     | 获取游戏内所有物品图鉴     | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Guide.png)     |
| ~攻略     | 获取角色攻略               | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Strategy.png)  |
| ~十连     | 抽卡模拟器                 | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Simulator.png) |
| ~公告     | 获取官方公告与资讯         | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/News.png)      |
| ~帮助     | 获取插件帮助               | ![renderings](https://cdn.jsdelivr.net/gh/erzaozi/waves-plugin@main/resources/readme/Help.png)      |

</details>

## 支持与贡献

如果你喜欢这个项目，请不妨点个 Star🌟，这是对开发者最大的动力， 当然，你可以对我 [爱发电](https://afdian.net/a/sumoqi) 赞助，呜咪~❤️

有意见或者建议也欢迎提交 [Issues](https://github.com/erzaozi/waves-plugin/issues) 和 [Pull requests](https://github.com/erzaozi/waves-plugin/pulls)。

## 资源

1. 图鉴：[库街区 Wiki](https://wiki.kurobbs.com/mc/home)
2. 角色攻略：[小沐 XMu](https://v.douyin.com/ijShaYJU/) （作者已授权）
3. 声骸评分计算：[SLDHshenlindahuo](https://github.com/SLDHshenlindahuo) 在线权重文档：[腾讯文档](https://docs.qq.com/sheet/DWFNtTHFlVmZ4dFN0)

## 许可证

本项目使用 [GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/) 作为开源许可证。

> [!CAUTION]
> 本项目 `resources` 文件夹下的所有文件均受到以下限制：
>
> - **禁止复制**：不允许复制 `resources` 文件夹中的任何文件。
> - **禁止修改**：不允许修改 `resources` 文件夹中的任何文件。
> - **禁止再分发**：不允许以任何形式再分发 `resources` 文件夹中的任何文件，包括但不限于公开托管、分享或将其包含在其他项目中。
