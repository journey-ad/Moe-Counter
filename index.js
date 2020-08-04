'use strict'

const fs = require('fs')
const express = require('express')
const compression = require('compression')

const db = require('./db')

const numList = require('./num-list')

const PLACES = 7

function getCountImage(count) {
  // This is not the greatest way for generating an SVG but it'll do for now
  const countArray = count.toString().padStart(PLACES, '0').split('')

  const parts = countArray.reduce((acc, next, index) => `
        ${acc}
        <image x="${index * 45}" y="0" width="45px" height="100px" xlink:href="data:image/gif;base64,${numList[next]}" />
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

  if (!name) return

  const counter = await db.getNum(name)
  const num = counter.num + 1

  db.setNum(counter.name, num)

  // This helps with GitHub's image cache 
  res.set({
    'content-type': 'image/svg+xml',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  // Send the generated SVG as the result
  res.send(getCountImage(num))
  console.log(counter)
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
