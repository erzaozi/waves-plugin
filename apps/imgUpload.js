import { pluginResources } from '../model/path.js';
import { randomUUID, createHash } from 'crypto';
import Config from '../components/Config.js';
import Wiki from '../components/Wiki.js';
import axios from 'axios';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export class ImgUploader extends plugin {
    constructor() {
        super({
            name: '鸣潮-面板图',
            event: 'message',
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~|鸣潮)上传(.*)面板图$",
                    fnc: 'uploadImage'
                },
                {
                    reg: "^(～|~|鸣潮)原图$",
                    fnc: 'originalPic'
                },
                {
                    reg: "^(?:～|~|鸣潮)(.*)面板图列表$",
                    fnc: "listImages"
                },
                {
                    reg: "^(?:～|~|鸣潮)删除(.*)面板图(\\d+)$",
                    fnc: "deleteImage"
                },
            ]
        });
    }

    async uploadImage(e) {
        const { allow_img_upload } = Config.getConfig();

        if (!e.isMaster && !allow_img_upload) {
            e.reply('只有主人才能上传面板图');
            return true;
        }

        let [, character] = e.msg.match(this.rule[0].reg);
        if (!character) {
            e.reply('请输入正确的命令格式，如：[~上传今汐面板图]');
            return true;
        }

        const wiki = new Wiki();
        character = await wiki.getAlias(character);

        const entryData = await wiki.getEntry(character, '1105');
        if (!entryData.status) {
            return await e.reply(`当前没有共鸣者 ${character}`);
        }

        const images = [...(e.img || [])];

        if (e.source) {
            let source;
            try {
                source = (await e[e.isGroup ? 'group' : 'friend']?.getChatHistory(e.isGroup ? e.source?.seq : e.source?.time + 1, 1))?.pop();
            } catch (error) {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`获取历史消息出错：\n${error}`));
            }

            if (source) {
                for (const msg of source.message) {
                    if (msg.type === 'image') {
                        images.push(msg.url);
                    } else if (msg.type === 'json' && /resid/.test(msg.data)) {
                        const resid = msg.data.match(/"resid":"(.*?)"/)?.[1];
                        if (resid) {
                            const forwardMessages = await e.bot?.getForwardMsg(resid) || [];
                            forwardMessages.forEach(item => images.push(...item.message.filter(itm => itm.type === 'image').map(itm => itm.url)));
                        }
                    }
                }
            }
        }

        if (e.reply_id) {
            let reply = (await e.getReply(e.reply_id)).message;
            for (const val of reply) {
                if (val.type === "image") {
                    images.push(val.url);
                }
            }
        }

        if (!images.length) {
            e.reply('请在消息中附带图片或引用图片消息');
            return true;
        }

        const status = await this.uploadImages(character, images);
        const failedUploads = status.filter(item => item.status === 'rejected');

        if (failedUploads.length) {
            const failedMessages = failedUploads.map(item => item.reason).join('\n');
            e.reply(`部分图片上传失败: ${failedMessages}`);
        } else {
            e.reply(`上传 ${character} 面板图成功, 本次一共上传了 ${status.length} 张面板图`);
        }
    }

    async uploadImages(character, imageList) {
        const imageDir = path.join(pluginResources, 'rolePic', character);
        fs.mkdirSync(imageDir, { recursive: true });

        return await Promise.allSettled(imageList.map(async (image, index) => {
            const savePath = path.join(imageDir, `${randomUUID()}.webp`);

            if (!(await this.downloadFile(image, savePath, 60 * 1000))) {
                throw new Error(`第 ${index + 1} 张图片下载失败`);
            }

            if (!(await this.isImageUnique(imageDir, savePath))) {
                fs.unlinkSync(savePath);
                return `第 ${index + 1} 张图片重复, 已删除`;
            }

            return `第 ${index + 1} 张图片下载文件成功`;
        }));
    }

    async originalPic(e) {
        const { allow_get_origin } = Config.getConfig();

        if (!e.isMaster && !allow_get_origin) {
            e.reply(`已禁止获取原图，请联系主人开启`);
            return true;
        }

        if (!e.source) return false;

        const source = await (async () => {
            try {
                return (await e[e.isGroup ? 'group' : 'friend']?.getChatHistory(
                    e.isGroup ? e.source.seq : e.source.time + 1, 1
                ))?.pop();
            } catch (error) {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`获取历史消息出错：\n${error}`));
                return null;
            }
        })();

        if (!source?.message_id) return false;

        const res = await redis.get(`Yunzai:waves:originpic:${source.message_id}`);
        if (!res) return false;

        const images = JSON.parse(res).img || [];
        const msg = [...images.map(img => ({ message: { ...segment.image(img), origin: true } }))];

        e.reply(msg.length > 1 ? Bot.makeForwardMsg(msg) : msg[0].message);
        return true;
    }

    async listImages(e) {
        const { allow_get_list } = Config.getConfig();

        if (!e.isMaster && !allow_get_list) {
            e.reply('只有主人才能获取面板图列表~');
            return true;
        }

        let [, character] = e.msg.match(this.rule[2].reg);
        if (!character) {
            e.reply('请输入正确的命令格式，如：[~今汐面板图列表]');
            return true;
        }

        character = await new Wiki().getAlias(character);

        const imageDir = path.join(pluginResources, 'rolePic', character);
        const images = fs.existsSync(imageDir) && fs.readdirSync(imageDir);

        if (!images?.length) {
            e.reply(`未找到 ${character} 的面板图`);
            return true;
        }

        const msg = [
            { message: `角色 ${character} 的面板图列表：` },
            ...images.map((item, index) => ({ message: [`${index + 1}.`, segment.image(`file:///${path.join(imageDir, item)}`)] })),
            { message: `请注意: 面板图均为网络采集或网友上传, 请勿用于商业用途, 仅供学习交流使用.\n如果这些图片侵犯了您的权益, 请及时联系我们删除, ${e.bot.nickname}主人不负任何法律责任` },
            { message: `如需删除图片, 请使用 "~删除${character}面板图1" 删除第一张图片, 以此类推` },
        ];

        const message = Bot.makeForwardMsg(msg);

        const msgRes = await e.reply(message);
        if (!msgRes?.message_id) {
            e.reply('面板图列表发送失败, 可尝试私聊查看');
            return false;
        }

        return true;
    }

    async deleteImage(e) {
        const { allow_img_delete } = Config.getConfig();

        if (!e.isMaster && !allow_img_delete) return e.reply('只有主人才能删除面板图');

        let [, character, index] = e.msg.match(this.rule[3].reg);
        if (!character) return e.reply('请输入正确的命令格式，如：[~删除今汐面板图1]');

        character = await new Wiki().getAlias(character);

        const imageDir = path.join(pluginResources, 'rolePic', character);
        const imageList = fs.existsSync(imageDir) ? fs.readdirSync(imageDir) : [];
        if (!imageList.length) return e.reply(`未找到 ${character} 的面板图`);

        if (index <= 0 || index > imageList.length) return e.reply(index > imageList.length
            ? `未找到第 ${index} 张图片, 请检查后重试`
            : '请输入正确的图片序号');

        fs.unlinkSync(path.join(imageDir, imageList[index - 1]));
        if (!fs.readdirSync(imageDir).length) fs.rmdirSync(imageDir);

        return e.reply(`删除 ${character} 的第 ${index} 张面板图成功`);
    }

    async downloadFile(url, savePath, timeout = 0) {
        await fs.promises.mkdir(path.dirname(savePath), { recursive: true });

        try {
            const response = await axios.get(url, { responseType: 'stream', timeout });

            await new Promise((resolve, reject) => {
                response.data
                    .pipe(sharp().webp())
                    .pipe(fs.createWriteStream(savePath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            return true;
        } catch (error) {
            const errorMessage = error.response
                ? `下载文件失败: ${error.response.statusText}`
                : error.code === 'ECONNABORTED'
                    ? `下载超时`
                    : `保存文件失败: ${error.message}`;

            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(errorMessage));
            return false;
        }
    }

    async isImageUnique(dir, imgPath) {
        const imgHash = createHash('md5').update(Buffer.from(fs.readFileSync(imgPath), 'base64').toString()).digest('hex');

        const checkPromises = fs.readdirSync(dir)
            .filter(item => item !== path.basename(imgPath))
            .map(item => {
                const md5 = createHash('md5').update(Buffer.from(fs.readFileSync(path.join(dir, item)), 'base64').toString()).digest('hex');
                return md5 === imgHash ? Promise.reject(new Error('图片重复')) : true;
            });

        const checkResults = await Promise.allSettled(checkPromises);

        return !checkResults.some(item => item.status === 'rejected');
    }
}