import fs from 'fs'
import Config from '../components/Config.js'
import { pluginRoot, _path } from './path.js'
import YAML from "yaml";

class Init {
    constructor() {
        this.compatible()
        this.initConfig()
        this.syncConfig().then(syncCount => {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.white(`同步了`), logger.green(syncCount), logger.white(`个用户信息`));
        });
    }

    initConfig() {
        // 创建数据目录
        if (!fs.existsSync(`${_path}/data/waves`)) {
            fs.mkdirSync(`${_path}/data/waves`, { recursive: true })
        }
        // 创建抽卡记录目录
        if (!fs.existsSync(`${_path}/data/wavesGacha`)) {
            fs.mkdirSync(`${_path}/data/wavesGacha`, { recursive: true })
        }
        // 创建自定义别名目录
        if (!fs.existsSync(`${pluginRoot}/resources/Alias/custom`)) {
            fs.mkdirSync(`${pluginRoot}/resources/Alias/custom`, { recursive: true })
        }
        // 检查默认配置文件
        const config_default_path = `${pluginRoot}/config/config_default.yaml`
        if (!fs.existsSync(config_default_path)) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`默认设置文件不存在，请检查或重新安装插件`));
            return true
        }
        // 检查配置文件
        const config_path = `${pluginRoot}/config/config/config.yaml`
        if (!fs.existsSync(config_path)) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`设置文件不存在，将使用默认设置文件`));
            fs.copyFileSync(config_default_path, config_path)
        }
        // 同步配置文件
        const config_default_yaml = Config.getDefConfig()
        const config_yaml = Config.getConfig()
        for (const key in config_default_yaml) {
            if (!(key in config_yaml)) {
                config_yaml[key] = config_default_yaml[key]
            }
        }
        for (const key in config_yaml) {
            if (!(key in config_default_yaml)) {
                delete config_yaml[key]
            }
        }
        Config.setConfig(config_yaml)
        // 检查默认用户配置文件
        const user_default_path = `${pluginRoot}/config/user_default.yaml`
        if (!fs.existsSync(config_default_path)) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`默认用户配置文件不存在，请检查或重新安装插件`));
            return true
        }
        // 检查用户配置文件
        const user_path = `${pluginRoot}/config/config/user.yaml`
        if (!fs.existsSync(user_path)) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`用户配置文件不存在，将使用默认用户配置文件`));
            fs.copyFileSync(user_default_path, user_path)
        }
        // 同步用户配置文件
        const user_default_yaml = Config.getDefUserConfig()
        const user_yaml = Config.getUserConfig()
        for (const key in user_default_yaml) {
            if (!(key in user_yaml)) {
                user_yaml[key] = user_default_yaml[key]
            }
        }
        for (const key in user_yaml) {
            if (!(key in user_default_yaml)) {
                delete user_yaml[key]
            }
        }
        Config.setUserConfig(user_yaml)
    }

    async compatible() {
        // 1.5.13 -> 1.5.14 分离配置文件与用户配置文件
        const config = Config.getConfig() || {};
        const keys = ['waves_auto_signin_list', 'waves_auto_task_list', 'waves_auto_push_list', 'waves_auto_news_list'];

        const lists = Object.fromEntries(keys.map(k => [k, config[k]]).filter(([, v]) => v));

        if (Object.keys(lists).length < keys.length) return true;

        keys.forEach(k => delete config[k]);
        Config.setConfig(config);
        Config.setUserConfig(lists);
    }

    async syncConfig() {
        let fileList = await fs.promises.readdir(`${_path}/data/waves`);
        let successCount = 0;

        for (let fileName of fileList) {
            if (!fileName.endsWith('.yaml')) continue;

            try {
                let userInfo = YAML.parse(await fs.promises.readFile(`${_path}/data/waves/${fileName}`, 'utf-8'));
                await redis.set(`Yunzai:waves:users:${fileName.split('.')[0]}`, JSON.stringify(userInfo));
                successCount++;
            } catch (error) {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`同步用户信息失败：\n${error}`));
            }
        }

        return successCount;
    }
}

export default new Init()
