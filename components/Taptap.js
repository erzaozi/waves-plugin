import axios from 'axios';

const CONSTANTS = {
    CHAR_DETAIL: "https://www.taptap.cn/webapiv2/game-record/v1/character-detail",
    USER_DETAIL: "https://www.taptap.cn/webapiv2/game-record/v1/detail-by-user",
};

class TapTap {
    constructor() {
    };

    async isAvailable(tap_id) {

        let data = {
            'app_id': 234280,
            'user_id': tap_id,
            'X-UA': 'V=1&PN=WebApp&LANG=zh_CN&VN_CODE=102&VN=0.1.0&LOC=CN&PLT=Android&DS=Android&UID=00e000ee-00e0-0e0e-ee00-f0c95d8ca115&VID=444444444&OS=Android&OSV=14.0.1'
        }

        try {
            let response = await axios.get(CONSTANTS.USER_DETAIL, { params: data });

            if (response.data.success) {
                if (response.data.data.is_bind) {
                    const subtitle = response.data.data.list[0].basic_module.subtitle;
                    let uid = subtitle.split("ID:")[1];
                    return { status: true, data: uid };
                } else {
                    return { status: false, msg: "当前Taptap账号还未绑定鸣潮账号" };
                }
            } else {
                return { status: false, msg: result.data.data.msg }
            }
        } catch (error) {
            logger.error('获取Taptap账号信息失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取Taptap账号信息失败，疑似网络问题，请检查控制台日志' };
        }
    }

    async getCharInfo(tap_id, name) {

        let data = {
            'app_id': 234280,
            'user_id': tap_id,
            'from': 0,
            'limit': 99,
            'X-UA': 'V=1&PN=WebApp&LANG=zh_CN&VN_CODE=102&VN=0.1.0&LOC=CN&PLT=Android&DS=Android&UID=00e000ee-00e0-0e0e-ee00-f0c95d8ca115&VID=444444444&OS=Android&OSV=14.0.1'
        }

        try {
            let response = await axios.get(CONSTANTS.CHAR_DETAIL, { params: data });
            if (response.data.success) {
                let roleInfo = response.data.data.list.find(role => name === role.name)
                return { status: true, data: roleInfo };
            } else {
                return { status: false, msg: "获取Taptap鸣潮角色信息信息失败" };
            }
        } catch (error) {
            logger.error('获取Taptap账号信息失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取Taptap账号信息失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default TapTap;