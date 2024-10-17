import YAML from 'yaml'
import fs from 'fs'
import { pluginRoot, _path } from '../model/path.js'

class Config {
    getConfig() {
        try {
            return YAML.parse(
                fs.readFileSync(`${pluginRoot}/config/config/config.yaml`, 'utf-8')
            )
        } catch (err) {
            logger.warn('读取 config.yaml 失败', err)
            return false
        }
    }

    getDefConfig() {
        try {
            return YAML.parse(
                fs.readFileSync(`${pluginRoot}/config/config_default.yaml`, 'utf-8')
            )
        } catch (err) {
            logger.warn('读取 config_default.yaml 失败', err)
            return false
        }
    }

    setConfig(config_data) {
        try {
            fs.writeFileSync(
                `${pluginRoot}/config/config/config.yaml`,
                YAML.stringify(config_data),
            )
            return true
        } catch (err) {
            logger.warn('写入 config.yaml 失败', err)
            return false
        }
    }

    getUserConfig(userId) {
        const userConfigPath = `${_path}/data/waves/${userId}.yaml`;

        try {
            if (fs.existsSync(userConfigPath)) {
                const configFileContent = fs.readFileSync(userConfigPath, 'utf-8');
                return YAML.parse(configFileContent);
            }

            return [];
        } catch (error) {
            logger.warn(`读取用户配置 ${userId}.yaml 失败`, error);
            return [];
        }
    }

    setUserConfig(userId, userData) {
        const userConfigPath = `${_path}/data/waves/${userId}.yaml`;

        try {
            if (userData.length === 0) {
                fs.unlinkSync(userConfigPath);
                redis.del(`Yunzai:waves:users:${userId}`);
                return true;
            }

            const yamlData = YAML.stringify(userData);
            fs.writeFileSync(userConfigPath, yamlData);
            redis.set(`Yunzai:waves:users:${userId}`, JSON.stringify(userData));

            return true;
        } catch (error) {
            logger.warn(`写入用户配置 ${userId}.yaml 失败`, error);
            return false;
        }
    }
}

export default new Config()
