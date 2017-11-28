const Promise = require('bluebird')
const request = Promise.promisify(require('request'))
const cheerio = require('cheerio')
const url = require('url')
const querystring = require('querystring')
const _ = require('lodash')
const ytdl = require('ytdl-core')
const moment = require('moment')
const fs = require('fs')

module.exports = { getPlaylistVideoIds, downloadVideoById }

async function getPlaylistPageVideoIds (playlistUrl) {
  const { body } = await request(playlistUrl)
  const $ = cheerio.load(body)
  const total = Number($('#playlist-length').text().replace(/\D/g, ''))
  const urls = $('a.playlist-video')
    .map((index, el) => $(el).attr('href'))
    .toArray()
    .map(it => `https://youtube.com${it}`)
  return { total, urls }
}

async function getPlaylistVideoIds (playlistUrl) {
  const { total, urls } = await getPlaylistPageVideoIds(playlistUrl)
  while (urls.length < total) {
    const more = await getPlaylistPageVideoIds(urls[urls.length - 1])
    urls.push(...more.urls)
  }
  return _.uniq(urls.map(it => querystring.parse(url.parse(it).query).v))
}

async function downloadVideoById (id, outputPath, onProgress) {
  const info = await ytdl.getInfo(id)
  const name = `${moment(info.published).format('YYYY-MM-DD')} ${info.title.replace(/\//g, '-')}`
  return new Promise((ok, fail) => {
    const video = ytdl.downloadFromInfo(info)
    const target = fs.createWriteStream(`${outputPath}/${name}.mp4`)
    video.on('progress', (chunk, ready, total) => {
      onProgress(name, 100 * ready / total)
      if (ready == total) {
        ok()
      }
    })
    video.on('error', fail)
    video.pipe(target)
  })
}
