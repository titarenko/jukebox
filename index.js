const Promise = require('bluebird')
const { getPlaylistVideoIds, downloadVideoById } = require('./youtube')
const { start, iterate, visualizeIterationProgress } = require('./ui')

async function downloadPlaylist (url, outputPath) {
  const ids = await getPlaylistVideoIds(url)
  start(ids.length)
  return Promise.map(ids, async id => {
    try {
      await downloadVideoById(id, outputPath, visualizeIterationProgress)
    } catch (e) {
    }
    iterate()
  }, { concurrency: 20 })
}

downloadPlaylist(process.argv[2], process.argv[3])
  .then(() => process.exit(0))
  .catch(console.error)
