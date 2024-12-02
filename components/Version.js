import fs from 'fs'

let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const yunzaiVersion = packageJson.version
const isMiao = packageJson.name === 'miao-yunzai'
const isTrss = !!Array.isArray(Bot.uin)

let Version = {
  isMiao,
  isTrss,
  get version() {
    return currentVersion
  },
  get yunzai() {
    return yunzaiVersion
  }
}

export default Version
