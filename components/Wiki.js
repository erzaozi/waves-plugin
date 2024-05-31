import axios from 'axios';
import qs from 'qs';

const CONSTANTS = {
    WIKI_PAGE_URL: 'https://api.kurobbs.com/wiki/core/catalogue/item/getPage',
    WIKI_ENTRYDETAIL_URL: 'https://api.kurobbs.com/wiki/core/catalogue/item/getEntryDetail',
    REQUEST_HEADERS_BASE: {
        "wiki_type": "9",
    },
    CATALOGUEID_MAP: {
        "1105": "共鸣者",
        "1106": "武器",
        "1107": "声骸",
        "1219": "合鸣效果",
        "1158": "敌人",
        "1264": "可合成道具",
        "1265": "道具合成图纸",
        "1217": "补给",
        "1161": "资源",
        "1218": "素材",
        "1223": "特殊道具",
    },
};

class Wiki {
    constructor() {
    }

    /**
     * 获取指定Wiki列表
     * @param {*} catalogueId
     * @returns 
     */
    async getPage(catalogueId) {

        let data = qs.stringify({
            catalogueId,
            limit: 1000,
        });

        try {
            const response = await axios.post(CONSTANTS.WIKI_PAGE_URL, data, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取Wiki列表失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取Wiki列表失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取Wiki列表失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 根据名字获取Wiki索引
    async getRecord(name) {
        for (const catalogueId in CONSTANTS.CATALOGUEID_MAP) {
            const response = await this.getPage(catalogueId);
            if (response.status) {
                const records = response.data.results.records;
                for (const record of records) {
                    if (record.name === name) {
                        return { status: true, record: record, type: catalogueId }
                    }
                }
            }
        }
        return { status: false, msg: '未找到该词条的Wiki信息' }
    }

    // 根据名字获取Wiki详情
    async getEntry(name) {
        const recordData = await this.getRecord(name);
        if (recordData.status) {
            const linkId = recordData.record.content.linkId;
            const entryData = await this.getEntryDetail(linkId);
            if (entryData.status) {
                return { status: true, record: entryData.data, type: recordData.type };
            } else {
                return { status: false, msg: entryData.msg };
            }
        } else {
            return { status: false, msg: recordData.msg };
        }
    }

    // 获取Wiki详情
    async getEntryDetail(linkId) {

        let data = qs.stringify({
            id: linkId,
        });

        try {
            const response = await axios.post(CONSTANTS.WIKI_ENTRYDETAIL_URL, data, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                logger.info(`获取Wiki详情成功`);
                return { status: true, data: response.data.data };
            } else {
                logger.error('获取Wiki详情失败：', response.data.msg);
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.error('获取Wiki详情失败，疑似网络问题：\n', error);
            return { status: false, msg: '获取Wiki详情失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default Wiki;
