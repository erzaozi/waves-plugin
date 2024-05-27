import fs from 'fs'
import { pluginRoot } from '../model/path.js'
let currentVersion
const package_path = `${pluginRoot}/package.json`
try {
  const package_json = JSON.parse(fs.readFileSync(package_path, 'utf-8'))
  if (package_json.version) {
    currentVersion = package_json.version
  }
} catch (err) {
  console.log('读取package.json失败', err)
}

/** 快捷logger：i-info m-mark w-warn e-error
 */
class Log {
  constructor () {
    this.header = `【Waves-Plugin v${currentVersion}】`
  }

  /** 快捷执行logger.info( )  */
  i (...msg) {
    logger.info(this.header, ...msg)
  }

  /** 快捷执行logger.mark( ) */
  m (...msg) {
    logger.mark(this.header, ...msg)
  }

  /** 快捷执行logger.warn( ) */
  w (...msg) {
    logger.warn(this.header, ...msg)
  }

  /** 快捷执行logger.error( ) */
  e (...msg) {
    logger.error(this.header, ...msg)
  }

  /** 快捷执行console.log( ) */
  c (...msg) {
    console.log(this.header, ...msg)
  }
}
export default new Log()
