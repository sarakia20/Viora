const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const ts = require('typescript')
const { webcrypto } = require('node:crypto')

// Execute source with the real schemas/calculation, replacing external side effects.
module.exports = function loadTypescript(file, mocks = {}, globals = {}, cache = new Map()) {
  const filename = path.resolve(file)
  if (cache.has(filename)) return cache.get(filename)
  const exports = {}
  cache.set(filename, exports)
  const nodeRequire = createRequire(filename)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const context = {
    URL, AbortSignal, crypto: webcrypto,
    process: { env: {} },
    console: { info() {}, error() {} },
    fetch() { throw new Error('Unexpected network call in test') },
    ...globals,
  }
  function requireSource(id) {
    if (Object.hasOwn(mocks, id)) return mocks[id]
    if (id.startsWith('.') || id.startsWith('@/')) {
      const base = id.startsWith('@/') ? path.resolve(id.slice(2)) : path.resolve(path.dirname(filename), id)
      const source = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')].find(fs.existsSync)
      if (source) return module.exports(source, mocks, globals, cache)
    }
    return nodeRequire(id)
  }
  // Mongoose validators must share the host realm's Function/Array prototypes.
  const execute = vm.runInThisContext(`(function(exports, require, ${Object.keys(context).join(',')}) {\n${code}\n})`, { filename })
  execute(exports, requireSource, ...Object.values(context))
  return exports
}
