'use strict'

const fs = require('fs')
const config = require('config-yml')
const express = require('express')
const compression = require('compression')

const db = require('./db')
const themify = require('./utils/themify')

const PLACES = 7

const app = express()

app.use(express.static('assets'))
app.use(compression())
app.set('view engine', 'pug')

app.get('/', (req, res) => {
  res.render('index')
});

const getCountByName = async name=> {
  // console.log(name)
  if (name === 'demo') return { num: '0123456789', name }
  try {
    const counter = await db.getNum(name) || { name, num: 0 }
    const r = counter.num + 1
    db.setNum(counter.name, r)
    return counter
  } catch (error) {
    console.log("get count by name is error: ", error)
    const errorDefaultCount = 0
    return  errorDefaultCount
  }
}

// the rest api get data
// link: https://www.liaoxuefeng.com/wiki/1022910821149312/1105009634703392
app.get('/rest/@:name', async (req, res) => {
  const name = req.params.name
  try {
    const data = await getCountByName(name)
    res.send(data)
  } catch (error) {
    res.send({
      num: 0,
      name
    })
  }
})

// get the image
app.get('/get/@:name', async (req, res) => {
  const name = req.params.name
  const theme = req.query.theme || 'moebooru'
  let length = PLACES, count = 0

  // This helps with GitHub's image cache 
  res.set({
    'content-type': 'image/svg+xml',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  const data = await getCountByName(name)
  count = data.num

  if (name === 'demo') {
    res.set({
      'cache-control': 'max-age=31536000'
    })
    length = 10
  }

  // Send the generated SVG as the result
  const renderSvg = themify.getCountImage({ count, theme, length })
  res.send(renderSvg)
})

app.get('/heart-beat', (req, res) => {
  res.set({
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  res.send('alive')
  console.log('heart-beat')
});

let port = 3000

try {
  let configPort = config.app.port
  if (configPort) {
    port = configPort
  }
} catch (error) {
  throw new Error(error)
}

const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
