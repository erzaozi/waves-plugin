import YAML from 'yaml';
import fs from 'fs';
import { pluginRoot, _path } from '../model/path.js';

class Config {
    constructor() {
        this.cache = {
            config: null,
            config_default: null,
            user: null,
            user_default: null,
        };

        this.fileMaps = {
            config: `${pluginRoot}/config/config/config.yaml`,
            config_default: `${pluginRoot}/config/config_default.yaml`,
            user: `${pluginRoot}/config/config/user.yaml`,
            user_default: `${pluginRoot}/config/user_default.yaml`,
        };

        this.watchFiles();
    }

    loadYAML(filePath) {
        try {
            return YAML.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (error) {
            const fileName = filePath.split('/').pop();
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`读取 ${fileName} 失败`), logger.red(error));
            return null;
        }
    }

    saveConfig(filePath, data) {
        try {
            fs.writeFileSync(filePath, YAML.stringify(data));
            return true;
        } catch (error) {
            const fileName = filePath.split('/').pop();
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`写入 ${fileName} 失败`), logger.red(error));
            return false;
        }
    }

    watchFiles() {
        Object.entries(this.fileMaps).forEach(([key, filePath]) => {
            fs.watchFile(filePath, () => {
                this.cache[key] = this.loadYAML(filePath);
            });
        });
    }

    getConfig() {
        if (!this.cache.config) {
            this.cache.config = this.loadYAML(this.fileMaps.config);
        }
        return this.cache.config;
    }

    getDefConfig() {
        if (!this.cache.config_default) {
            this.cache.config_default = this.loadYAML(this.fileMaps.config_default);
        }
        return this.cache.config_default;
    }

    setConfig(config_data) {
        if (this.saveConfig(this.fileMaps.config, config_data)) {
            this.cache.config = config_data;
            return true;
        }
        return false;
    }

    getUserConfig() {
        if (!this.cache.user) {
            this.cache.user = this.loadYAML(this.fileMaps.user);
        }
        return this.cache.user;
    }

    getDefUserConfig() {
        if (!this.cache.user_default) {
            this.cache.user_default = this.loadYAML(this.fileMaps.user_default);
        }
        return this.cache.user_default;
    }

    setUserConfig(user_data) {
        return this.saveConfig(this.fileMaps.user, user_data);
    }

    getUserData(userId) {
        const userConfigData = `${_path}/data/waves/${userId}.yaml`;
        try {
            return fs.existsSync(userConfigData) ? this.loadYAML(userConfigData) : [];
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`读取用户数据 ${userId}.yaml 失败`), logger.red(error));
            return [];
        }
    }

    setUserData(userId, userData) {
        const userConfigData = `${_path}/data/waves/${userId}.yaml`;
        try {
            if (!userData.length) {
                if (fs.existsSync(userConfigData)) fs.unlinkSync(userConfigData);
                redis.del(`Yunzai:waves:users:${userId}`);
                return true;
            }

            this.saveConfig(userConfigData, userData);
            redis.set(`Yunzai:waves:users:${userId}`, JSON.stringify(userData));
            return true;
        } catch (error) {
            logger.mark(logger.blue('[WAVES PLUGIN]'), logger.cyan(`写入用户数据 ${userId}.yaml 失败`), logger.red(error));
            return false;
        }
    }
}

export default new Config();