const blessed = require('blessed')
const Eta = require('node-eta')
const _ = require('lodash')

module.exports = { start, iterate, visualizeIterationProgress }

const screen = blessed.screen({ smartCSR: true })
screen.key(['escape', 'q', 'C-c'], () => process.exit(0))
const render = _.throttle(() => screen.render(), 2000, { trailing: true })

const box = blessed.box({
  parent: screen,
  left: 0,
  top: 0,
  height: '100%',
  width: '100%',
  keys: true,
  scrollable: true,
  autoPadding: true,
  scrollbar: { ch: ' ' },
})

let index = 1, eta, mainText, mainBar, bars = { }

function start (total) {
  eta = new Eta(total)
  eta.start()
  mainText = blessed.text({
    parent: box,
    content: '',
    width: '100%',
    top: 0,
    left: 0,
  })
  mainBar = blessed.progressbar({
    parent: box,
    filled: 0,
    ch: '#',
    width: '100%',
    height: 1,
    top: 1,
    left: 0,
  })
}

function iterate () {
  eta.iterate()
  mainText.setContent(eta.format('{{etah}} {{progress}}'))
  mainBar.setProgress(100 * eta.done / eta.count)
  render()
}

function visualizeIterationProgress (content, progress) {
  if (bars[content]) {
    bars[content].setProgress(progress)
    if (progress == 1) {
      eta.iterate(1)
    }
  } else {
    blessed.text({
      parent: box,
      content,
      width: '100%',
      top: index * 2,
      left: 0,
    })
    bars[content] = blessed.progressbar({
      parent: box,
      filled: progress,
      ch: '#',
      width: '100%',
      height: 1,
      top: index++ * 2 + 1,
      left: 0,
    })
  }
  render()
}
