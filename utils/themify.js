'use strict'

const fs = require('fs')
const path = require('path')
const mimeType = require('mime-types')

const themePath = path.resolve(__dirname, '../assets/theme')

const themeList = {}

fs.readdirSync(themePath).forEach(theme => {
  if(!(theme in themeList)) themeList[theme] = {}
  const imgList = fs.readdirSync(path.resolve(themePath, theme))
  imgList.forEach(img => {
    const name = path.parse(img).name
    themeList[theme][name] = convertToDatauri(path.resolve(themePath, theme, img))
  })
})

function convertToDatauri(path){
  const mime = mimeType.lookup(path)
  const base64 = fs.readFileSync(path).toString('base64')

  return `data:${mime};base64,${base64}`
}

function wrap(num, theme='konachan'){
  if(!(theme in themeList)) theme = 'konachan'
  return themeList[theme][num]
}

module.exports = {
  wrap
}