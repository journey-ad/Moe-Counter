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

  if (name === 'demo') {
    res.set({
      'cache-control': 'max-age=31536000'
    })
    count = '0123456789'
    length = 10

  } else {
    const counter = await db.getNum(name) || { name, num: 0 }
    count = counter.num + 1

    db.setNum(counter.name, count)
    console.log(counter, `theme: ${theme}`)
  }

  // Send the generated SVG as the result
  res.send(themify.getCountImage({ count, theme, length }))
})

app.get('/heart-beat', (req, res) => {
  res.set({
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  res.send('alive')
  console.log('heart-beat')
});

const listener = app.listen(config.app.port, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
