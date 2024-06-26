import plugin from "../../../lib/plugins/plugin.js";
import { pluginResources } from "../model/path.js";
import fs from "fs";

export class Emoji extends plugin {
  constructor() {
    super({
      name: "鸣潮-表情包",
      event: "message",
      priority: 1009,
      rule: [
        {
          reg: "^(～鸣潮|~鸣潮)(随机)?(表情包)$",
          fnc: "emoji",
        },
      ],
    });
  }

  async emoji(e) {
    let files = fs.readdirSync(pluginResources + "/emojis");
    let file = files[Math.floor(Math.random() * files.length)];
    let path = pluginResources + "/emojis/" + file;
    e.reply(segment.image(path));
    return true;
  }
}
