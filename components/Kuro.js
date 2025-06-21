import Config from './Config.js';
import axios from 'axios';
import qs from 'qs';
import { HttpsProxyAgent } from 'https-proxy-agent';

const CONSTANTS = {
    SIGNIN_URL: '/user/signIn',
    LIKE_URL: '/forum/like',
    SHARE_URL: '/encourage/level/shareTask',
    DETAIL_URL: '/forum/getPostDetail',
    TASK_PROCESS_URL: '/encourage/level/getTaskProcess',
    GET_COIN_URL: '/encourage/gold/getTotalGold',
    FORUM_LIST: '/forum/list',

    REQUEST_HEADERS_BASE: {
        "source": "ios",
    },
};

const kuroApi = axios.create();
kuroApi.interceptors.request.use(
    async config => {
        const proxyUrl = Config.getConfig().proxy_url;
        if (proxyUrl) {
            const proxyAgent = new HttpsProxyAgent(proxyUrl);
            config.httpsAgent = proxyAgent;
        }
        if (config.url.startsWith('/')) {
            config.url = Config.getConfig().reverse_proxy_url + config.url;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

class Kuro {
    constructor() {
    }

    // 获取可用性
    async isAvailable(token, strict = false) {

        let data = qs.stringify({
            'gameId': 0
        });


        try {
            const response = await kuroApi.post(CONSTANTS.TASK_PROCESS_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '' } });

            if (response.data.code === 220) {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取可用性成功，账号已过期`));
                return false;
            } else {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取可用性成功，账号可用`));
                }
                return true;
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取可用性失败，疑似网络问题`), logger.red(error));
            return !strict;
        }
    }

    // 用户签到
    async signIn(token) {

        let data = qs.stringify({
            'gameId': 2
        });

        try {
            const response = await kuroApi.post(CONSTANTS.SIGNIN_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区用户签到成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区用户签到失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区用户签到失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '库街区用户签到失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 点赞
    async like(postId, toUserId, token) {
        let data = qs.stringify({
            'gameId': 3,
            'likeType': 1,
            'operateType': 1,
            'postId': postId,
            'toUserId': toUserId
        });

        try {
            const response = await kuroApi.post(CONSTANTS.LIKE_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区点赞成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区点赞失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区点赞失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '库街区点赞失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 分享帖子
    async share(token) {
        let data = qs.stringify({
            'gameId': 3
        });

        try {
            const response = await kuroApi.post(CONSTANTS.SHARE_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '' } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区分享成功`));
                }
                return { status: true, data: response.data.msg };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区分享失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区分享失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '库街区分享失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 浏览帖子
    async detail(postId, token) {
        let data = qs.stringify({
            'postId': postId
        });

        try {
            const response = await kuroApi.post(CONSTANTS.DETAIL_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, version: '', devcode: '' } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区浏览帖子成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区浏览帖子失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区浏览帖子失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '库街区浏览帖子失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取帖子
    async getPost() {
        let data = qs.stringify({
            'forumId': 9,
            'gameId': 3
        });

        try {
            const response = await kuroApi.post(CONSTANTS.FORUM_LIST, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, version: '', devcode: '' } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区获取帖子成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区获取帖子失败`), logger.red(response.data.msg));
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区获取帖子失败，疑似网络问题`), logger.red(error));
        }
    }

    // 获取任务进度
    async taskProcess(token) {
        let data = qs.stringify({
            'gameId': 0
        });

        try {
            const response = await kuroApi.post(CONSTANTS.TASK_PROCESS_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '' } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区获取任务进度成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区获取任务进度失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区获取任务进度失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '库街区获取任务进度失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取库洛币总数
    async getCoin(token) {

        try {
            const response = await kuroApi.post(CONSTANTS.GET_COIN_URL, null, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '' } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`库街区获取库洛币总数成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区获取库洛币总数失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`库街区获取库洛币总数失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '库街区获取库洛币总数失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default Kuro;