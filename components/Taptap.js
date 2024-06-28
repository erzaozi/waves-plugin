import axios from 'axios';

const BASE_URL = "https://www.taptap.cn";
const CONSTANTS = {
    CHAR_DETAIL: "/webapiv2/game-record/v1/character-detail",
    USER_DETAIL: "/webapiv2/game-record/v1/detail-by-user"
};
const PARAM = {
    "app_id": 234280,
    "X-UA": "V=1&PN=WebApp&LANG=zh_CN&VN_CODE=102&VN=0.1.0&LOC=CN&PLT=Android&DS=Android&UID=00e000ee-00e0-0e0e-ee00-f0c95d8ca115&VID=444444444&OS=Android&OSV=14.0.1"
};
const HEADER = {
    "Host": "www.taptap.cn"
}

class TapTap {
    constructor(tap_id) {
        this.tap_id = tap_id;
    };

    async isAvailable() {
        const param = {
            user_id: this.tap_id,
            ...PARAM
        };
        const queryString = Object.keys(param)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(param[key])}`)
            .join('&');
        try {
            let result = await axios.get(BASE_URL + CONSTANTS.USER_DETAIL + "?" + queryString, { headers: HEADER });
            if (result.data.success) {
                if (result.data.data.is_bind) {
                    const subtitle = result.data.data.list[0].basic_module.subtitle;
                    let uid = subtitle.split("ID:")[1];
                    return { status: true, msg: uid };
                } else {
                    return { status: false, msg: "当前TAPTAP账号还未绑定鸣潮账号" };
                }
            } else {
                return { status: false, msg: result.data.data.msg }
            }
        } catch (error) {
            logger.error('获取TAPTAP账号信息失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取TAPTAP账号信息失败，疑似网络问题，请检查控制台日志' };
        }
    }

    async getCharInfo(name) {
        const param = {
            user_id: this.tap_id,
            from: 0,
            limit: 99,
            ...PARAM
        };
        const queryString = Object.keys(param)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(param[key])}`)
            .join('&');
        try {
            let result = await axios.get(BASE_URL + CONSTANTS.CHAR_DETAIL + "?" + queryString, { headers: HEADER });
            if (result.data.success) {
                let roleInfo = result.data.data.list.find(role => name === role.name)
                return { status: true, msg: roleInfo };
            } else {
                return { status: false, msg: "获取TAPTAP鸣潮角色信息信息失败" };
            }
        } catch (error) {
            logger.error('获取TAPTAP账号信息失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取TAPTAP账号信息失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default TapTap;