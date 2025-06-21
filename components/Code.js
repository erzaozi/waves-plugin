import Config from './Config.js';
import axios from 'axios';
import qs from 'qs';
import { HttpsProxyAgent } from 'https-proxy-agent';

const CONSTANTS = {
    LOGIN_URL: 'https://api.kurobbs.com/user/sdkLogin',
    REFRESH_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/refreshData',
    TOKEN_REFRESH_URL: 'https://api.kurobbs.com/aki/roleBox/requestToken',
    GAME_DATA_URL: 'https://api.kurobbs.com/gamer/widget/game3/refresh',
    BASE_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/baseData',
    ROLE_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/roleData',
    CALABASH_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/calabashData',
    CHALLENGE_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/challengeDetails',
    EXPLORE_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/exploreIndex',
    SIGNIN_URL: 'https://api.kurobbs.com/encourage/signIn/v2',
    QUERY_RECORD_URL: 'https://api.kurobbs.com/encourage/signIn/queryRecordV2',
    GACHA_URL: 'https://gmserver-api.aki-game2.com/gacha/record/query',
    INTL_GACHA_URL: 'https://gmserver-api.aki-game2.net/gacha/record/query',
    ROLE_DETAIL_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/getRoleDetail',
    EVENT_LIST_URL: 'https://api.kurobbs.com/forum/companyEvent/findEventList',
    SELF_TOWER_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/towerDataDetail',
    OTHER_TOWER_DATA_URL: 'https://api.kurobbs.com/aki/roleBox/akiBox/towerIndex',

    REQUEST_HEADERS_BASE: {
        "source": "ios",
    },
};

const wavesApi = axios.create();
wavesApi.interceptors.request.use(
    async config => {
        const proxyUrl = Config.getConfig().proxy_url;
        if (proxyUrl) {
            const proxyAgent = new HttpsProxyAgent(proxyUrl);
            config.httpsAgent = proxyAgent;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

class Waves {
    constructor() {
        this.bat = null;
    }

    // 验证码登录
    async getToken(mobile, code) {

        const devCode = [...Array(40)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[(Math.random() * 36) | 0]).join('');

        let data = qs.stringify({
            mobile,
            code,
        });

        try {
            const response = await wavesApi.post(CONSTANTS.LOGIN_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, devCode } });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`验证码登录成功，库街区用户`), logger.green(response.data.data.userName));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`验证码登录失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`验证码登录失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '登录失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取可用性
    async isAvailable(serverId, roleId, token, strict = false) {

        let data = qs.stringify({
            'serverId': serverId,
            'roleId': roleId
        });


        try {
            const response = await wavesApi.post(CONSTANTS.TOKEN_REFRESH_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 220) {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取可用性成功，账号已过期`));
                return false;
            } else {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取可用性成功，账号可用`));
                }
                this.bat = JSON.parse(response.data.data).accessToken;
                return true;
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取可用性失败，疑似网络问题`), logger.red(error));
            return !strict;
        }
    }

    // 刷新资料
    async refreshData(serverId, roleId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await wavesApi.post(CONSTANTS.REFRESH_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`刷新资料成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`刷新资料失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`刷新资料失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '刷新资料失败，疑似网络问题，请检查控制台日志' };
        }
    }


    // 日常数据
    async getGameData(token) {

        let data = qs.stringify({
            'type': '2',
            'sizeType': '1'
        });


        try {
            const response = await wavesApi.post(CONSTANTS.GAME_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 200) {
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取日常数据失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取日常数据成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取日常数据失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取日常数据失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取日常数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 我的资料
    async getBaseData(serverId, roleId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await wavesApi.post(CONSTANTS.BASE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null || !response.data.data.showToGuest) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取我的资料失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取我的资料成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取我的资料失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取我的资料失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取我的资料失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 共鸣者
    async getRoleData(serverId, roleId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await wavesApi.post(CONSTANTS.ROLE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null || !response.data.data.showToGuest) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取共鸣者失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取共鸣者成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取共鸣者失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取共鸣者失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取共鸣者失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 数据坞
    async getCalabashData(serverId, roleId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await wavesApi.post(CONSTANTS.CALABASH_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取数据坞失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取数据坞成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取数据坞失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取数据坞失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取数据坞失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 挑战数据
    async getChallengeData(serverId, roleId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId,
            'countryCode': 1
        });

        try {
            const response = await wavesApi.post(CONSTANTS.CHALLENGE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null || !response.data.data.open) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取挑战数据失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取挑战数据成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取挑战数据失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取挑战数据失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取挑战数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 探索数据
    async getExploreData(serverId, roleId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId,
            'countryCode': 1
        });

        try {
            const response = await wavesApi.post(CONSTANTS.EXPLORE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null || !response.data.data.open) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取探索数据失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取探索数据成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取探索数据失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取探索数据失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取探索数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取角色详细信息
    async getRoleDetail(serverId, roleId, id, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'serverId': serverId,
            'roleId': roleId,
            'id': id
        });

        try {
            const response = await wavesApi.post(CONSTANTS.ROLE_DETAIL_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取角色详细信息失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取角色详细信息成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取角色详细信息失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取角色详细信息失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取角色详细信息失败，疑似网络问题，请检查控制台日志' };
        }

    }

    // 签到
    async signIn(serverId, roleId, userId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId,
            'userId': userId,
            'reqMonth': (new Date().getMonth() + 1).toString().padStart(2, '0'),
        });

        try {
            const response = await wavesApi.post(CONSTANTS.SIGNIN_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '', 'b-at': this.bat } });

            if (response.data.code === 200) {
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`签到失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`签到成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`签到失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`签到失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '签到失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 签到领取记录
    async queryRecord(serverId, roleId, token) {

        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await wavesApi.post(CONSTANTS.QUERY_RECORD_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, 'b-at': this.bat } });

            if (response.data.code === 200) {
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`查询签到领取记录失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`查询签到领取记录成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`查询签到领取记录失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`查询签到领取记录失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '查询签到领取记录失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 逆境深塔数据
    async getTowerData(serverId, roleId, token) {
        await this.refreshData(serverId, roleId, token)

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await wavesApi.post(CONSTANTS.SELF_TOWER_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '', 'b-at': this.bat } });

            if (response.data.code === 10902 || response.data.code === 200) {
                response.data.data = JSON.parse(response.data.data)
                if (response.data.data === null) {
                    const other = await wavesApi.post(CONSTANTS.OTHER_TOWER_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '', 'b-at': this.bat } });
                    if (other.data.code === 200) {
                        other.data.data = JSON.parse(other.data.data)
                        if (other.data.data === null) {
                            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取逆境深塔数据失败，返回空数据`));
                            return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                        }
                        if (Config.getConfig().enable_log) {
                            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取逆境深塔数据成功`));
                        }
                        return { status: true, data: other.data.data };
                    } else {
                        logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取逆境深塔数据失败`), logger.red(other.data.msg));
                        return { status: false, msg: other.data.msg };
                    }
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取逆境深塔数据成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取逆境深塔数据失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取逆境深塔数据失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取逆境深塔数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 抽卡记录
    async getGaCha(data) {

        const isCN = !!(data.serverId == "76402e5b20be2c39f095a152090afddc");

        try {
            const response = await wavesApi.post(isCN ? CONSTANTS.GACHA_URL : CONSTANTS.INTL_GACHA_URL, data);

            if (response.data.code === 0) {
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取抽卡记录失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取抽卡记录成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取抽卡记录失败`), logger.red(response.data.message));
                return { status: false, msg: response.data.message };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取抽卡记录失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取抽卡记录失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取公共Cookie
    async pubCookie() {
        if (!Config.getConfig().use_public_cookie) return false;

        const keys = await redis.keys('Yunzai:waves:users:*');
        const values = (await Promise.all(keys.map(key => redis.get(key))))
            .map(value => value ? JSON.parse(value) : null)
            .filter(Boolean)
            .flat()
            .sort(() => Math.random() - 0.5);

        for (let value of values) {
            if (value.token && await this.isAvailable(value.serverId, value.roleId, value.token)) {
                return value;
            }
        }

        return false;
    }

    // 获取活动列表
    async getEventList(eventType = 0) {

        let data = qs.stringify({
            'gameId': 3,
            'eventType': eventType
        });

        try {
            const response = await wavesApi.post(CONSTANTS.EVENT_LIST_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'b-at': this.bat } });

            if (response.data.code === 200) {
                if (response.data.data === null) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.yellow(`获取活动列表失败，返回空数据`));
                    return { status: false, msg: "查询信息失败，请检查库街区数据终端中对应板块的对外展示开关是否打开" };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取活动列表成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取活动列表失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取活动列表失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取活动列表失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default Waves;