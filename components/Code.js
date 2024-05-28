import axios from 'axios';
import qs from 'qs';

const CONSTANTS = {
    LOGIN_URL: 'https://api.kurobbs.com/user/sdkLogin',
    GAME_DATA_URL: 'https://api.kurobbs.com/gamer/widget/game3/getData',
    BASE_DATA_URL: 'https://api.kurobbs.com/gamer/roleBox/aki/baseData',
    ROLE_DATA_URL: 'https://api.kurobbs.com/gamer/roleBox/aki/roleData',
    CALABASH_DATA_URL: 'https://api.kurobbs.com/gamer/roleBox/aki/calabashData',
    CHALLENGE_DATA_URL: 'https://api.kurobbs.com/gamer/roleBox/aki/challengeIndex',
    EXPLORE_DATA_URL: 'https://api.kurobbs.com/gamer/roleBox/aki/exploreIndex',
    SIGNIN_URL: 'https://api.kurobbs.com/encourage/signIn/v2',
    REQUEST_HEADERS_BASE: {
        "source": "android",
    },
};

class Waves {
    constructor() {
    }

    // 验证码登录
    async getToken(mobile, code) {

        const devCode = [...Array(40)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[(Math.random() * 36) | 0]).join('');

        let data = qs.stringify({
            mobile,
            code,
            devCode
        });

        try {
            const response = await axios.post(CONSTANTS.LOGIN_URL, data, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                logger.info(`验证码登录成功，库街区用户：${response.data.data.userName}`);
                return { status: true, data: response.data.data };
            } else {
                logger.error('验证码登录失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('验证码登录失败，疑似网络问题：\n', error);
            return { status: false, msg: '登录失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取可用性
    async isAvailable(token) {

        let data = qs.stringify({
            'type': '2',
            'sizeType': '1'
        });


        try {
            const response = await axios.post(CONSTANTS.GAME_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 220) {
                logger.info('获取可用性成功：账号已过期');
                return false;
            } else {
                logger.info('获取可用性成功：账号可用');
                return true;
            }
        } catch (error) {
            logger.error('获取可用性失败，疑似网络问题：\n', error);
            return false;
        }
    }

    // 日常数据
    async getGameData(token) {

        let data = qs.stringify({
            'type': '2',
            'sizeType': '1'
        });


        try {
            const response = await axios.post(CONSTANTS.GAME_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                logger.info('获取日常数据成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取日常数据失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取日常数据失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取日常数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 我的资料
    async getBaseData(serverId, roleId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await axios.post(CONSTANTS.BASE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                logger.info('获取我的资料成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取我的资料失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取我的资料失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取我的资料失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 共鸣者
    async getRoleData(serverId, roleId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await axios.post(CONSTANTS.ROLE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                logger.info('获取共鸣者成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取共鸣者失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取共鸣者失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取共鸣者失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 数据坞
    async getCalabashData(serverId, roleId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await axios.post(CONSTANTS.CALABASH_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                logger.info('获取数据坞成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取数据坞失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取数据坞失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取数据坞失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 挑战数据
    async getChallengeData(serverId, roleId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId
        });

        try {
            const response = await axios.post(CONSTANTS.CHALLENGE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                logger.info('获取挑战数据成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取挑战数据失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取挑战数据失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取挑战数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 探索数据
    async getExploreData(serverId, roleId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId,
            'countryCode': 1
        });

        try {
            const response = await axios.post(CONSTANTS.EXPLORE_DATA_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token } });

            if (response.data.code === 200) {
                logger.info('获取探索数据成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取探索数据失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取探索数据失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取探索数据失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 签到
    async signIn(serverId, roleId, userId, token) {

        let data = qs.stringify({
            'gameId': 3,
            'serverId': serverId,
            'roleId': roleId,
            'userId': userId,
            'reqMonth': (new Date().getMonth() + 1).toString().padStart(2, '0'),
        });

        try {
            const response = await axios.post(CONSTANTS.SIGNIN_URL, data, { headers: { ...CONSTANTS.REQUEST_HEADERS_BASE, 'token': token, devcode: '' } });

            if (response.data.code === 200) {
                logger.info('签到成功');
                return { status: true, data: response.data.data };
            } else {
                logger.error('签到失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('签到失败，疑似网络问题：\n', error);
            return { status: false, msg: '签到失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default Waves;
