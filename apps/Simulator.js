import plugin from '../../../lib/plugins/plugin.js'
import { pluginResources } from "../model/path.js";
import Render from '../components/Render.js';
import Wiki from '../components/Wiki.js';
import YAML from 'yaml'
import fs from 'fs'

export class Simulator extends plugin {
    constructor() {
        super({
            name: "鸣潮-模拟抽卡",
            event: "message",
            priority: 1009,
            rule: [
                {
                    reg: "^(～|~|鸣潮)(角色|武器)?(十连|抽卡)$",
                    fnc: "simulator"
                }
            ]
        })
    }

    async simulator(e) {
        let type = e.msg.includes('武器') ? 'weapon' : 'role'
        let data = YAML.parse(fs.readFileSync(pluginResources + `/Simulator/${type}.yaml`, 'utf8'))

        let gachaData = []

        for (let i = 0; i < 10; i++) {

            let userData = JSON.parse(await redis.get(`Yunzai:waves:simulator:${type}:${e.user_id}`)) || { five_star_time: 0, five_star_other: true, four_star_time: 0, four_star_other: true };
            let { five_star_time, five_star_other, four_star_time, four_star_other } = userData;

            if (five_star_time < 70) {
                if (Math.random() < data.five_star.basic) {
                    if (five_star_other) {
                        if (Math.random() < data.five_star.other) {
                            gachaData.push({ role: data.five_star.other_pool[Math.floor(Math.random() * data.five_star.other_pool.length)].name, star: 5 });
                            five_star_other = false
                            five_star_time = 0
                            await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                            continue

                        } else {
                            gachaData.push({ role: data.five_star.up_pool[Math.floor(Math.random() * data.five_star.up_pool.length)].name, star: 5 });
                            five_star_other = true
                            five_star_time = 0
                            await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                            continue
                        }
                    } else {
                        gachaData.push({ role: data.five_star.up_pool[Math.floor(Math.random() * data.five_star.up_pool.length)].name, star: 5 });
                        five_star_other = true
                        five_star_time = 0
                        await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                        continue

                    }
                }
            }


            if (Math.random() < ((five_star_time - 69) * data.five_star.increase + data.five_star.basic)) {
                if (five_star_other) {
                    if (Math.random() < data.five_star.other) {
                        gachaData.push({ role: data.five_star.other_pool[Math.floor(Math.random() * data.five_star.other_pool.length)].name, star: 5 });
                        five_star_other = false
                        five_star_time = 0
                        await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                        continue

                    } else {
                        gachaData.push({ role: data.five_star.up_pool[Math.floor(Math.random() * data.five_star.up_pool.length)].name, star: 5 });
                        five_star_other = true
                        five_star_time = 0
                        await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                        continue

                    }
                } else {
                    gachaData.push({ role: data.five_star.up_pool[Math.floor(Math.random() * data.five_star.up_pool.length)].name, star: 5 });
                    five_star_other = true
                    five_star_time = 0
                    await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                    continue

                }
            }

            five_star_time++

            if (four_star_time < 9) {
                if (Math.random() < data.four_star.basic) {
                    if (four_star_other) {
                        if (Math.random() < data.four_star.other) {
                            gachaData.push({ role: data.four_star.other_pool[Math.floor(Math.random() * data.four_star.other_pool.length)].name, star: 4 });
                            four_star_other = false
                            four_star_time = 0
                            await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                            continue

                        } else {
                            gachaData.push({ role: data.four_star.up_pool[Math.floor(Math.random() * data.four_star.up_pool.length)].name, star: 4 });
                            four_star_other = true
                            four_star_time = 0
                            await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                            continue

                        }
                    } else {
                        gachaData.push({ role: data.four_star.up_pool[Math.floor(Math.random() * data.four_star.up_pool.length)].name, star: 4 });
                        four_star_other = true
                        four_star_time = 0
                        await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                        continue

                    }
                }
            }


            if (four_star_time >= 9) {
                if (four_star_other) {
                    if (Math.random() < data.four_star.other) {
                        gachaData.push({ role: data.four_star.other_pool[Math.floor(Math.random() * data.four_star.other_pool.length)].name, star: 4 });
                        four_star_other = false
                        four_star_time = 0
                        await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                        continue

                    } else {
                        gachaData.push({ role: data.four_star.up_pool[Math.floor(Math.random() * data.four_star.up_pool.length)].name, star: 4 });
                        four_star_other = true
                        four_star_time = 0
                        await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                        continue

                    }
                } else {
                    gachaData.push({ role: data.four_star.up_pool[Math.floor(Math.random() * data.four_star.up_pool.length)].name, star: 4 });
                    four_star_other = true
                    four_star_time = 0
                    await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
                    continue

                }
            }

            four_star_time++
            gachaData.push({ role: data.three_star.other_pool[Math.floor(Math.random() * data.three_star.other_pool.length)].name, star: 3 });

            await redis.set(`Yunzai:waves:simulator:${type}:${e.user_id}`, JSON.stringify({ five_star_time, five_star_other, four_star_time, four_star_other }))
        }

        const wiki = new Wiki()
        let promises = gachaData.map(async (data) => {
            let record = await wiki.getRecord(data.role);
            data.role = record.record.content.contentUrl;
        });

        await Promise.all(promises);

        const imageCard = await Render.render('Template/simulatorGacha/simulatorGacha', {
            gachaData: { userName: e.sender.nickname, poolName: data.pool_name, times: JSON.parse(await redis.get(`Yunzai:waves:simulator:${type}:${e.user_id}`)).five_star_time, list: gachaData },
        }, { e, retType: 'base64' });

        await e.reply(imageCard)
        return true
    }
}
