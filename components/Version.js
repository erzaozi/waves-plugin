import fs from 'fs'

let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const yunzaiVersion = packageJson.version
const isMiao = packageJson.name === 'miao-yunzai'
const isMangoCat = packageJson.name === 'MangoCat-Yunzai'
const isTrss = !!Array.isArray(Bot.uin) && !isMangoCat

let Version = {
  isMiao,
  isMangoCat,
  isTrss,
  get version() {
    return currentVersion
  },
  get yunzai() {
    return yunzaiVersion
  }
}

export default Version
