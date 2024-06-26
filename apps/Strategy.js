import plugin from "../../../lib/plugins/plugin.js";
import { pluginResources } from "../model/path.js";
import Wiki from "../components/Wiki.js";
import fs from "fs";

export class Strategy extends plugin {
  constructor() {
    super({
      name: "鸣潮-攻略",
      event: "message",
      priority: 1009,
      rule: [
        {
          reg: "^(～鸣潮|~鸣潮)?.*攻略$",
          fnc: "strategy",
        },
      ],
    });
  }

  async strategy(e) {
    const match = e.msg.match(/(～鸣潮|~鸣潮)?(.*?)攻略/);
    if (!match || !match[2]) {
      return false;
    }

    const message = match[2];

    const wiki = new Wiki();
    const name = await wiki.getAlias(message);

    if (!fs.existsSync(`${pluginResources}/Strategy/${name}.jpg`)) {
      logger.warn(`[Waves-Plugin] 未能获取攻略角色：${message}`);
      if (
        e.msg.startsWith("~") ||
        e.msg.startsWith("～") ||
        e.msg.startsWith("鸣潮")
      ) {
        await e.reply(`暂时还没有${message}的攻略`);
      }
      return false;
    } else {
      await e.reply(segment.image(`${pluginResources}/Strategy/${name}.jpg`));
      return true;
    }
  }
}
