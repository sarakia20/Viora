const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const load = require('./helpers/load-typescript.cjs')

const file = 'components/shared/product/product-description.tsx'
const children = [
  React.createElement('h3', { key: 'heading' }, 'Technical details'),
  React.createElement('ul', { key: 'list' },
    React.createElement('li', null, React.createElement('a', { href: '/guide' }, 'Complete guide')),
  ),
]

test('initial collapsed HTML contains the complete description markup', () => {
  const Description = load(file).default
  const html = renderToStaticMarkup(React.createElement(Description, null, children))
  assert.ok(html.includes('overflow-hidden'))
  assert.ok(html.includes('<h3>Technical details</h3>'))
  assert.ok(html.includes('<ul><li><a href="/guide">Complete guide</a></li></ul>'))
})

test('description detects overflow on resize and toggles without replacing its content', () => {
  let height = 64
  let lineHeight = '32px'
  let measureOnResize
  let startObservation
  let disconnected = false
  let cursor
  const state = []
  const content = {
    getClientRects: () => [1],
    getBoundingClientRect: () => ({ height }),
  }
  const Description = load(file, {
    react: {
      useId: () => 'description',
      useRef: () => ({ current: content }),
      useEffect: effect => { startObservation = effect },
      useState(initial) {
        const index = cursor++
        state[index] ??= initial
        return [state[index], update => {
          state[index] = typeof update === 'function' ? update(state[index]) : update
        }]
      },
    },
  }, {
    getComputedStyle: () => ({ lineHeight }),
    ResizeObserver: class {
      constructor(callback) { measureOnResize = callback }
      observe(element) { assert.equal(element, content) }
      disconnect() { disconnected = true }
    },
  }).default

  const render = () => {
    cursor = 0
    return Description({ children }).props.children
  }
  render()
  const cleanup = startObservation()
  assert.equal(render()[1], false)

  height = 96
  measureOnResize()
  let [preview, button] = render()
  assert.ok(preview.props.className.includes('overflow-hidden'))
  assert.equal(button.props.children, 'مشاهده بیشتر')
  assert.equal(button.props['aria-expanded'], false)
  assert.equal(button.props['aria-controls'], preview.props.id)

  button.props.onClick()
  ;[preview, button] = render()
  assert.ok(!preview.props.className.includes('overflow-hidden'))
  assert.equal(preview.props.children.props.children, children)
  assert.equal(button.props.children, 'مشاهده کمتر')
  assert.equal(button.props['aria-expanded'], true)

  button.props.onClick()
  ;[preview, button] = render()
  assert.ok(preview.props.className.includes('overflow-hidden'))
  assert.equal(button.props['aria-expanded'], false)

  height = 72
  lineHeight = '36px'
  measureOnResize()
  assert.equal(render()[1], false)
  cleanup()
  assert.equal(disconnected, true)
})
