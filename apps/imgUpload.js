import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Wiki from '../components/Wiki.js';
import Config from '../components/Config.js';
import { randomUUID, createHash } from 'crypto';
import { pluginResources } from '../model/path.js';

export class imgUpload extends plugin {
    constructor() {
        const ruler = [
            { reg: /^(～|~|#?鸣潮)上传(.*)面板图$/, fnc: 'imgUpload' },
            { reg: /^(～|~|#?鸣潮)原图$/, fnc: 'getOriginalPic' },
            { reg: /^(～|~|#?鸣潮)(.*)面板图列表$/, fnc: 'getPicList' },
            { reg: /^(～|~|#?鸣潮)删除(.*)面板图(\d+)$/, fnc: 'delPic' },
        ];
        super({
            name: '鸣潮-面板图',
            event: 'message',
            priority: 1009,
            rule: ruler
        })
    }

    /**
     * 上传鸣潮角色面板图
     * @param {Object} e | 消息对象
     * @returns {Boolean} 执行结果
     */
    async imgUpload(e) {
        // 检查权限, 是否仅主人可上传.
        if (!checkPermission(e, 'imgUpload')) {
            e.reply('只有主人才能上传面板图哦~');
            return true;
        }

        // 匹配角色名.
        let char = e.msg.match(this.rule[0].reg)[2] || '';
        if (!char) { e.reply('未找到角色, 请使用 "~上传今汐面板图" 进行上传, 尽量不要使用别名.'); return true; }

        // 矫正部分别名.
        const wiki = new Wiki();
        char = await wiki.getAlias(char);

        // 从 当前/历史 消息中获取所有图片.
        const imgList = await this.getMsgImg(e);

        if (!imgList || !imgList.length) { e.reply('请在消息中附带图片或引用图片消息.'); return true; }

        // 上传角色图片.
        const status = await this.upImg(char, imgList);

        // 上传状态校验.
        if (status.filter(item => item.status === 'rejected').length) {
            let failed = status.filter(item => item.status === 'rejected').map(item => item.reason);
            if (failed.length > 1) { failed = failed.join('\n'); } else { failed = failed.pop(); }

            e.reply(`部分图片上传失败: ${failed}`);
        }
        else { e.reply(`上传 ${char} 面板图成功, 本次一共上传了 ${status.length} 上面板图.`); }
    }

    /**
     * 从 当前/历史 消息中获取图片
     * @param {Object} e | 消息对象
     * @returns {Promise<Array>} imgList | 图片链接列表
     */
    async getMsgImg(e) {
        let imgList = e.img || [];
        if (e.source) {
            let source;
            try {
                source = (
                    await e[e.isGroup ? 'group' : 'friend']
                        ?.getChatHistory(e.isGroup ? e.source?.seq : e.source?.time + 1, 1)
                ).pop();

            } catch (err) { logger.error(err); source = undefined; }

            if (source) {
                for (const msg of source.message) {
                    // 处理历史消息中的图片
                    if (msg.type === 'image') { imgList.push(msg.url); }

                    // 处理历史记录中的json, 也就是ICQQ的转发消息
                    if (msg.type === 'json' && (/resid/).test(msg.data)) {
                        const resid = msg.data.match(/"resid":"(.*?)"/)[1] || '';
                        if (resid) {
                            const forwardMsgs = await e.bot?.getForwardMsg(resid) || [];

                            imgList = forwardMsgs.map(item => {
                                return item.message
                                    .filter(itm => itm.type === 'image')
                                    .map(itm => itm?.url || '');
                            })
                                .reduce((acc, cur) => acc.concat(cur), [])
                                .filter(item => item);
                        }
                    }
                }
            }
        }

        return imgList;
    }

    /**
     * 下载面板图
     * @param {String} char | 角色名称
     * @param {Array} imgList | 图片链接列表
     * @returns {Promise<Array>} 下载结果
     */
    async upImg(char, imgList) {
        const imgDir = path.join(pluginResources, 'rolePic', char);

        if (!fs.existsSync(imgDir)) { fs.mkdirSync(imgDir, { recursive: true }); }

        const downloadPromise = imgList.map(async (img, index) => {
            const savePath = path.join(imgDir, `${randomUUID()}.webp`);

            const status = await downloadFile(img, savePath, 60 * 1000);
            if (!status) { throw new Error(`第 ${index + 1} 张图片下载失败...`); }
            else {
                if (!await checkImage(imgDir, savePath)) {
                    fs.unlinkSync(savePath);
                    return `第 ${index + 1} 张图片重复, 已删除...`;
                }

                return `第 ${index + 1} 张图片下载文件成功...`;
            }
        });

        return await Promise.allSettled(downloadPromise);
    }

    /**
     * 获取原图
     * @param {Object} e | 消息对象
     * @returns {Promise<Boolean>} 执行结果
     */
    async getOriginalPic(e) {
        // 检查权限, 是否仅主人可上传.
        if (!checkPermission(e, 'getOriginalPic')) {
            e.reply([
                `已禁止获取原图, 请联系主人开启.\n`,
                segment.image('https://gchat.qpic.cn/gchatpic_new/746659424/4144974507-2439053290-125E4E51B9D45F2C955E6675AF7C6CEE/0?term=3&is_origin=0'),
            ]);
            return true;
        }

        if (!e.source) { return false; }

        let source;
        try {
            source = (
                await e[e.isGroup ? 'group' : 'friend']
                    ?.getChatHistory(e.isGroup ? e.source?.seq : e.source?.time + 1, 1)
            ).pop();
        } catch (err) { logger.error(err); source = undefined; }

        if (!source || !source.message_id) { return false; }

        const key = `waves:original-picture:${source?.message_id}`;
        let res = await redis.get(key);

        if (!res) { return false; }
        else {
            res = JSON.parse(res);
            const msg = ['拿去吧, 涩批~'];
            if (res.img && res.img.length) {
                for (const img of res.img) {
                    msg.push(segment.image(img));
                }
            }

            if (msg.length > 2) { e.reply(await e.runtime.common.makeForwardMsg(msg)); }
            else { e.reply(msg); }
        }
        return true;
    }

    /**
     * 获取面板图列表
     * @param {Object} e | 消息对象
     * @returns {Promise<Boolean>} 执行结果
     */
    async getPicList(e) {
        if (!checkPermission(e, 'getPicList')) {
            e.reply('只有主人才能获取面板图列表哦~');
            return true;
        }

        const char = e.msg.match(this.rule[2].reg)[2] || '';
        if (!char) { e.reply('未找到角色, 请使用 "~今汐面板图列表" 获取, 尽量不要使用别名.'); return true; }

        const imgDir = path.join(pluginResources, 'rolePic', char);

        if (!fs.existsSync(imgDir) || !fs.readdirSync(imgDir).length) { e.reply(`未找到 ${char} 的面板图.`); return true; }

        const msg = [
            `角色 ${char} 的面板图列表:`,
            ...fs.readdirSync(imgDir).map((item, index) => {
                return [`${index + 1}. `, segment.image(`file:///${path.join(imgDir, item)}`)];
            }),
            `请注意: 面板图均为网络采集或网友上传, 请勿用于商业用途, 仅供学习交流使用.\n如果这些图片侵犯了您的权益, 请及时联系我们删除, ${e.bot.nickname}主人不负任何法律责任.`,
            `如需删除图片, 请使用 "~删除${char}面板图1" 删除第一张图片, 以此类推.`,
        ];

        let message;
        try {
            message = await e.runtime?.common?.makeForwardMsg(e, msg);
        } catch (err) { logger.error(err); message = msg; }

        const msgRes = await e.reply(message);
        if (!msgRes || !msgRes.message_id) { e.reply('面板图列表发送失败, 可尝试私聊查看.'); return false; }

        return true;
    }

    /**
     * 删除面板图
     * @param {Object} e | 消息对象
     * @returns {Boolean} 执行结果
     */
    async delPic(e) {
        if (!checkPermission(e, 'delPic')) {
            e.reply('只有主人才能删除面板图哦~');
            return true;
        }

        const char = e.msg.match(this.rule[3].reg)[2] || '';
        if (!char) { e.reply('未找到角色, 请使用 "~删除今汐面板图1" 进行删除, 尽量不要使用别名.'); return true; }

        const imgDir = path.join(pluginResources, 'rolePic', char);

        if (!fs.existsSync(imgDir) || !fs.readdirSync(imgDir).length) { e.reply(`未找到 ${char} 的面板图.`); return true; }

        const index = Number(e.msg.match(/(\d+)/)?.[1]) || 0;
        const imgList = fs.readdirSync(imgDir);

        if (index > imgList.length) { e.reply(`未找到第 ${index} 张图片, 请检查后重试.`); return true; }
        else if (isNaN(index) || index <= 0) { e.reply('请输入正确的图片序号.'); return true; }

        fs.unlinkSync(path.join(imgDir, imgList[index - 1]));

        if (!fs.readdirSync(imgDir).length) { fs.rmdirSync(imgDir); }
        e.reply(`删除 ${char} 的第 ${index} 张面板图成功.`);

        return true;
    }
}

// 工具函数
/**
 * 检查权限
 * @param {Object} e | 消息对象
 * @param {String} method | 方法名
 * @returns {Boolean}
 */
function checkPermission(e, method) {
    const userConfig = Config.getConfig();
    const defConfig = Config.getDefConfig();

    const config = { ...defConfig, ...userConfig };

    const methodList = {
        imgUpload: 'allowImgUpload',
        getOriginalPic: 'allowGetOrigin',
        getPicList: 'allowGetList',
        delPic: 'allowImgDelete',
    };

    if (!e.isMaster && !config[methodList[method]]) { return false; }
    else { return true; }
}

/**
 * 下载保存文件
 * @param {String} fileUrl 下载地址
 * @param {String} savePath 保存路径
 * @param {Number} timeout 超时时间
 * @returns {Promise<boolean>}
 */
async function downloadFile(fileUrl, savePath, timeout = 0) {
    // 确保目录存在, 不存在则创建前置目录
    const ensureDirectoryExists = async (filePath) => {
        const dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) { fs.mkdirSync(dirname, { recursive: true }); }
    };

    await ensureDirectoryExists(savePath);

    try {
        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: timeout || 0,
        });

        const fileStream = fs.createWriteStream(savePath);
        response.data.pipe(fileStream);

        await new Promise((resolve, reject) => {
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
        });

        return true;
    } catch (err) {
        if (err.response) {
            logger.error(`[uploadPanel][downloadFile] Failed to download file: ${err.response.statusText}`);
        } else if (err.code === 'ECONNABORTED') {
            logger.error(`[uploadPanel][downloadFile] Download timeout after ${timeout} ms`);
        } else {
            logger.error(`[uploadPanel][downloadFile] Failed to save file: ${err.message}`);
        }
        return false;
    }
}

/**
 * MD5加密
 * @param {String} data
 * @returns {String}
 */
function MD5(data) {
    return createHash('md5').update(data).digest('hex');
}

/**
 * 检查图片是否重复
 * @param {String} dir 图片路径
 * @param {String} imgPath 图片路径
 * @returns {Promise<boolean>}
 */
async function checkImage(dir, imgPath) {
    const buffers = fs.readFileSync(imgPath);
    const base64 = Buffer.from(buffers, 'base64').toString();
    const imgMd5 = MD5(base64);
    const data = fs.readdirSync(dir);

    // 校验目录下除图片本身外的所有md5
    const checkPromise = data.filter(item => item !== path.basename(imgPath)).map(async item => {
        const buff = fs.readFileSync(path.join(dir, item));
        const base = Buffer.from(buff, 'base64').toString();
        const md5 = MD5(base);
        if (md5 === imgMd5) { throw new Error('图片重复'); }
        else { return true; }
    });

    const checkResult = await Promise.allSettled(checkPromise);

    // 校验md5结果, 存在rejected即为有重复, 返回false, 否则true
    return checkResult.filter(item => item.status === 'rejected').length <= 0;
}
