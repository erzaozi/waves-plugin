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
            logger.warn('读取config.yaml失败', err)
            return false
        }
    }

    getDefConfig() {
        try {
            return YAML.parse(
                fs.readFileSync(`${pluginRoot}/config/config_default.yaml`, 'utf-8')
            )
        } catch (err) {
            logger.warn('读取config_default.yaml失败', err)
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
            logger.warn('写入config.yaml失败', err)
            return false
        }
    }

    getUserConfig(userId) {
        try {
            if (fs.existsSync(`${_path}/data/waves/${userId}.yaml`)) {
                return YAML.parse(
                    fs.readFileSync(`${_path}/data/waves/${userId}.yaml`, 'utf-8')
                )
            } else {
                return []
            }
        } catch (err) {
            logger.warn(`读取用户配置${userId}.yaml失败`, err)
            return false
        }
    }

    setUserConfig(userId, data) {
        try {
            fs.writeFileSync(
                `${_path}/data/waves/${userId}.yaml`,
                YAML.stringify(data),
            )
            redis.set(`Yunzai:waves:users:${userId}`, JSON.stringify(data));
        } catch (err) {
            logger.warn(`写入用户配置${userId}.yaml失败`, err)
            return false
        }
    }

    getTapTable() {
        try {
            if (fs.existsSync(`${_path}/data/waves/waves_tap.yaml`)) {
                let table = YAML.parse(fs.readFileSync(`${_path}/data/waves/waves_tap.yaml`, 'utf-8'))
                if (!table) return {}
                return table
            } else {
                return {}
            }
        } catch (err) {
            logger.warn(`读取taptap鸣潮绑定表waves_tap.yaml失败`, err)
            return false
        }
    }

    setTapTable(data) {
        try {
            fs.writeFileSync(
                `${_path}/data/waves/waves_tap.yaml`,
                YAML.stringify(data),
            )
        } catch (err) {
            logger.warn(`写入taptap鸣潮绑定表waves_tap.yaml失败`, err)
            return false
        }
    }
}

export default new Config()
