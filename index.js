'use strict'

const fs = require('fs')
const express = require('express')
const compression = require('compression')

const db = require('./utils/db')
const themify = require('./utils/themify')

const PLACES = 7

function getCountImage({ count, theme='konachan', PLACES=PLACES }) {
  // This is not the greatest way for generating an SVG but it'll do for now
  const countArray = count.toString().padStart(PLACES, '0').split('')

  const parts = countArray.reduce((acc, next, index) => `
        ${acc}
        <image x="${index * 45}" y="0" width="45px" height="100px" xlink:href="${themify.wrap(next, theme)}" />
`, '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PLACES * 45}" height="100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Kawaii Count</title>
    <g>
      ${parts}
    </g>
</svg>
`
}


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
  const theme = req.query.theme || 'konachan'
  let length = PLACES, num = 0

  // This helps with GitHub's image cache 
  res.set({
    'content-type': 'image/svg+xml',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  if (name === 'demo') {
    num = '0123456789'
    length = 10

  } else {
    const counter = await db.getNum(name)
    num = counter.num + 1

    db.setNum(counter.name, num)
    console.log(counter, `theme: ${theme}`)
  }

  // Send the generated SVG as the result
  res.send(getCountImage({ count: num, theme, PLACES: length }))
})

app.get('/heart-beat', (req, res) => {
  res.set({
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  res.send('alive')
  console.log('heart-beat')
});

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
