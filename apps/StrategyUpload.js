import { pluginResources } from '../model/path.js';
import { randomUUID, createHash } from 'crypto';
import Config from '../components/Config.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

export class StrategyUploader extends plugin {
    constructor() {
        super({
            name: '攻略图上传管理',
            event: 'message',
            priority: 1009,
            rule: [
                {
                    reg: "^(?:～|~)上传(.+?)攻略(?:/(.+?\.(?:png|jpg|jpeg|gif|webp)))?$",
                    fnc: 'uploadStrategyImage'
                },
                {
                    reg: "^(?:～|~)删除(.*)攻略$",
                    fnc: "deleteAllStrategyImages"
                },
                {
                    reg: "^(?:～|~)攻略列表$",
                    fnc: "listStrategyFolders"
                },
                {
                    reg: "^(?:～|~)上传攻略帮助$",
                    fnc: "uploadHelp"
                }
            ]
        });
    }

    async uploadStrategyImage(e) {
        const { allow_img_upload } = Config.getConfig();

        if (!e.isMaster && !allow_img_upload) {
            e.reply('只有主人才能上传攻略图');
            return true;
        }

        let [, strategyName, customFilename] = e.msg.match(this.rule[0].reg);
        if (!strategyName) {
            e.reply('请输入正确的命令格式，如：[~上传深渊攻略] 或 [~上传深渊攻略/xxx.png]');
            return true;
        }

        strategyName = strategyName.replace(/[^\w\u4e00-\u9fa5]/g, '').trim();
        if (!strategyName) {
            e.reply('攻略名称不能为空');
            return true;
        }

        const images = [...(e.img || [])];

        if (e.reply_id) {
            let reply = (await e.getReply(e.reply_id)).message;
            for (const val of reply) {
                if (val.type === "image") images.push(val.url);
            }
        }

        if (e.source) {
            let source;
            try {
                source = (await e[e.isGroup ? 'group' : 'friend']?.getChatHistory(e.isGroup ? e.source?.seq : e.source?.time + 1, 1))?.pop();
            } catch (error) {
                console.error('[攻略插件] 获取历史消息出错:', error);
            }

            if (source) {
                for (const msg of source.message) {
                    if (msg.type === 'image') {
                        images.push(msg.url);
                    } else if (msg.type === 'json' && /resid/.test(msg.data)) {
                        const resid = msg.data.match(/"resid":"(.*?)"/)?.[1];
                        if (resid) {
                            const forwardMessages = await e.bot?.getForwardMsg(resid) || [];
                            forwardMessages.forEach(item => {
                                images.push(...item.message.filter(itm => itm.type === 'image').map(itm => itm.url));
                            });
                        }
                    }
                }
            }
        }

        if (!images.length) {
            e.reply('请在消息中附带图片或引用图片消息');
            return true;
        }

        const status = await this.uploadStrategyImages(strategyName, images, customFilename);
        const failedUploads = status.filter(item => item.status === 'rejected');

        if (failedUploads.length) {
            const failedMessages = failedUploads.map(item => item.reason).join('\n');
            e.reply(`部分图片上传失败: ${failedMessages}`);
        } else {
            e.reply(`上传 [${strategyName}] 攻略图成功, 本次上传 ${status.length} 张图片`);
        }
    }

    async deleteAllStrategyImages(e) {
        const { allow_img_delete } = Config.getConfig();

        if (!e.isMaster && !allow_img_delete) {
            e.reply('只有主人才能删除攻略图');
            return true;
        }

        let [, strategyName] = e.msg.match(this.rule[1].reg);
        if (!strategyName) {
            e.reply('请输入正确的命令格式，如：[~删除深渊攻略]');
            return true;
        }

        strategyName = strategyName.replace(/[^\w\u4e00-\u9fa5]/g, '').trim();

        const strategyDir = path.join(pluginResources, 'Strategy', strategyName);

        if (!fs.existsSync(strategyDir)) {
            e.reply(`未找到 [${strategyName}] 的攻略图目录`);
            return true;
        }

        fs.rmSync(strategyDir, { recursive: true, force: true });
        e.reply(`已删除 [${strategyName}] 的所有攻略图`);
    }

    async listStrategyFolders(e) {
        const { allow_get_list } = Config.getConfig();

        if (!e.isMaster && !allow_get_list) {
            e.reply('只有主人才能查看攻略列表');
            return true;
        }

        const strategyDir = path.join(pluginResources, 'Strategy');

        if (!fs.existsSync(strategyDir)) {
            e.reply('暂无任何攻略');
            return true;
        }

        const folders = fs.readdirSync(strategyDir).filter(item => {
            const itemPath = path.join(strategyDir, item);
            return fs.statSync(itemPath).isDirectory();
        });

        if (folders.length === 0) {
            e.reply('暂无任何攻略');
            return true;
        }

        let message = '攻略列表：\n';
        folders.forEach((folder, index) => {
            const folderPath = path.join(strategyDir, folder);
            const imageCount = fs.existsSync(folderPath)
                ? fs.readdirSync(folderPath).length
                : 0;
            message += `${index + 1}. ${folder} (${imageCount}张图片)\n`;
        });

        e.reply(message);
        return true;
    }

    async uploadHelp(e) {
        e.reply(
`【攻略上传帮助】
通过～攻略列表，获取攻略文件夹名称
使用格式如下：
～上传名称攻略/角色名.png （图片名可选）

示例：
～上传moealkyne攻略/安可.jpg
注意事项：
- 支持在消息中附带图片，或引用消息
- 仅支持 jpg格式
- 同名文件将覆盖旧图`
        );
        return true;
    }

    async uploadStrategyImages(strategyName, imageList, customFilename) {
        const strategyDir = path.join(pluginResources, 'Strategy', strategyName);
        fs.mkdirSync(strategyDir, { recursive: true });

        let index = 0;

        return await Promise.allSettled(imageList.map(async (image) => {
            index++;

            const ext = path.extname(image.split('?')[0]) || '.jpg';
            const baseName = customFilename?.replace(/[\\/:*?"<>|]/g, '') || `${randomUUID()}${ext}`;
            const savePath = path.join(strategyDir, baseName);

            if (!(await this.downloadFile(image, savePath, 60 * 1000))) {
                throw new Error(`第 ${index} 张图片下载失败`);
            }

            if (!(await this.isImageUnique(strategyDir, savePath))) {
                fs.unlinkSync(savePath);
                return `第 ${index} 张图片重复, 已删除`;
            }

            return `第 ${index} 张图片下载成功`;
        }));
    }

    async downloadFile(url, savePath, timeout = 0) {
        await fs.promises.mkdir(path.dirname(savePath), { recursive: true });

        try {
            const response = await axios.get(url, {
                responseType: 'stream',
                timeout,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            await new Promise((resolve, reject) => {
                response.data
                    .pipe(fs.createWriteStream(savePath))
                    .on('finish', resolve)
                    .on('error', reject);
            });

            return true;
        } catch (error) {
            console.error('[攻略] 下载图片出错:', error);
            return false;
        }
    }

    async isImageUnique(dir, imgPath) {
        try {
            const imgData = fs.readFileSync(imgPath);
            const imgHash = createHash('md5').update(imgData).digest('hex');

            const files = fs.readdirSync(dir).filter(item => item !== path.basename(imgPath));

            for (const file of files) {
                const fileData = fs.readFileSync(path.join(dir, file));
                const fileHash = createHash('md5').update(fileData).digest('hex');
                if (fileHash === imgHash) return false;
            }
            return true;
        } catch (error) {
            console.error('[攻略插件] 图片去重检查出错:', error);
            return true;
        }
    }
}
