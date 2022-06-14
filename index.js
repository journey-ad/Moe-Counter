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
  const { name } = req.params
  const { theme = 'moebooru' } = req.query
  let length = PLACES

  // This helps with GitHub's image cache 
  res.set({
    'content-type': 'image/svg+xml',
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  const data = await getCountByName(name)

  if (name === 'demo') {
    res.set({
      'cache-control': 'max-age=31536000'
    })
    length = 10
  }

  // Send the generated SVG as the result
  const renderSvg = themify.getCountImage({ count: data.num, theme, length })
  res.send(renderSvg)

  console.log(data, `theme: ${theme}`)
})

// JSON record
app.get('/record/@:name', async (req, res) => {
  const { name } = req.params

  const data = await getCountByName(name)

  res.json(data)
})

app.get('/number/@:num', async (req, res) => {
	const { num } = req.params
	console.log(num)
	const { theme = 'moebooru' } = req.query

	let length = PLACES
	// This helps with GitHub's image cache
	res.set({
		'content-type': 'image/svg+xml',
		'cache-control': 'max-age=0, no-cache, no-store, must-revalidate',
	})
	length = 10

	// Send the generated SVG as the result
	const renderSvg = themify.getCountImage({
		count: parseInt(num),
		theme,
		length,
	})
	res.send(renderSvg)
})

app.get('/heart-beat', (req, res) => {
  res.set({
    'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
  })

  res.send('alive')
  console.log('heart-beat')
});

const listener = app.listen(config.app.port || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

async function getCountByName(name) {
  const defaultCount = { name, num: 0 }

  if (name === 'demo') return { name, num: '0123456789' }

  try {
    const counter = await db.getNum(name) || defaultCount
    const num = counter.num + 1
    db.setNum(counter.name, num)
    return counter

  } catch (error) {
    console.log("get count by name is error: ", error)
    return defaultCount

  }
}
