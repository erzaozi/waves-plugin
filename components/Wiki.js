import { pluginResources } from "../model/path.js";
import Config from './Config.js';
import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import YAML from 'yaml';
import { HttpsProxyAgent } from 'https-proxy-agent';

const CONSTANTS = {
    WIKI_PAGE_URL: '/wiki/core/catalogue/item/getPage',
    WIKI_ENTRYDETAIL_URL: '/wiki/core/catalogue/item/getEntryDetail',
    WIKI_SEARCH_URL: '/wiki/core/catalogue/item/search',
    WIKI_HOMEPAGE_URL: '/wiki/core/homepage/getPage',
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

const wikiApi = axios.create();
wikiApi.interceptors.request.use(
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
            const response = await wikiApi.post(CONSTANTS.WIKI_PAGE_URL, data, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取 Wiki 列表失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取Wiki列表失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取 Wiki 列表失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 根据名字获取Wiki索引
    async getRecord(name, type = '') {
        if (type) {
            const response = await this.getPage(type);
            if (response.status) {
                const { records } = response.data.results;
                for (const record of records) {
                    if (record.name === name) {
                        return { status: true, record: record, type: type }
                    }
                }
            }
            return { status: false, msg: '未找到该词条的Wiki信息' }
        } else {
            const responses = await Promise.all(Object.keys(CONSTANTS.CATALOGUEID_MAP).map(id => this.getPage(id)));

            for (const [i, response] of responses.entries()) {
                const catalogueId = Object.keys(CONSTANTS.CATALOGUEID_MAP)[i];

                if (response.status) {
                    const record = response.data.results.records.find(record => record.name === name);
                    if (record) {
                        return { status: true, record: record, type: catalogueId };
                    }
                }
            }

            return { status: false, msg: '未找到该词条的Wiki信息' };
        }
    }

    // 根据名字获取Wiki详情
    async getEntry(name, type = '') {
        const recordData = await this.getRecord(name, type);
        if (recordData.status) {
            const { linkId } = recordData.record.content;
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
            const response = await wikiApi.post(CONSTANTS.WIKI_ENTRYDETAIL_URL, data, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取 Wiki 详情成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取 Wiki 详情失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取 Wiki 详情失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取 Wiki 详情失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 获取别名
    async getAlias(name) {
        const paths = [
            pluginResources + '/Alias',
            pluginResources + '/Alias/custom'
        ];

        for (const path of paths) {
            const files = fs.readdirSync(path).filter(file => file.endsWith('.yaml'));
            for (const file of files) {
                const content = fs.readFileSync(`${path}/${file}`, 'utf8');
                const alias = YAML.parse(content);
                for (const [key, values] of Object.entries(alias)) {
                    if (values.includes(name)) {
                        return key;
                    }
                }
            }
        }
        return name;
    }

    // 搜索关键词
    async search(keyword) {

        let data = qs.stringify({
            keyword,
            limit: 1000,
        });

        try {
            const response = await wikiApi.post(CONSTANTS.WIKI_SEARCH_URL, data, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                if (response.data.data.results === null) {
                    return { status: false, msg: '未找到该词条的Wiki信息' };
                }
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`搜索 Wiki 成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`搜索 Wiki 失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`搜索 Wiki 失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '搜索 Wiki 失败，疑似网络问题，请检查控制台日志' };
        }
    }

    // 搜索类型
    async getTypeList(type) {
        let catalogueId = Object.keys(CONSTANTS.CATALOGUEID_MAP).find(key => CONSTANTS.CATALOGUEID_MAP[key] === type);
        if (catalogueId) {
            const response = await this.getPage(catalogueId);
            if (response.status) {
                return { status: true, data: response.data };
            } else {
                return { status: false, msg: response.msg };
            }
        } else {
            return { status: false, msg: '未找到该类型' };
        }
    }

    // 获取首页
    async getHomePage() {
        try {
            const response = await wikiApi.post(CONSTANTS.WIKI_HOMEPAGE_URL, null, { headers: CONSTANTS.REQUEST_HEADERS_BASE });

            if (response.data.code === 200) {
                if (Config.getConfig().enable_log) {
                    logger.mark(logger.blue('[WAVES PLUGIN]'), logger.green(`获取 Wiki 首页成功`));
                }
                return { status: true, data: response.data.data };
            } else {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取 Wiki 首页失败`), logger.red(response.data.msg));
                return { status: false, msg: response.data.msg };
            }
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`获取 Wiki 首页失败，疑似网络问题`), logger.red(error));
            return { status: false, msg: '获取 Wiki 首页失败，疑似网络问题，请检查控制台日志' };
        }
    }
}

export default Wiki;
