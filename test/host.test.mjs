// Offline check of the dsh-clock host half, including the new defaultZone path.
// In plain Node, @deepseek-ai/schemastery is not resolvable, which is exactly the
// fallback this plugin must survive: Config becomes undefined and the tool still
// works off the host zone.
import { apply, Config, name, inject } from '../index.js'

const failures = []
const expect = (ok, label, detail) => {
  if (!ok) failures.push(`${label}${detail === undefined ? '' : ` -> ${detail}`}`)
}

function load(config) {
  const captured = {}
  apply({ tools: { register: definition => { captured.definition = definition } } }, config)
  return captured.definition
}

expect(name === 'dsh-clock', 'name export')
expect(inject.includes('tools'), 'inject tools')
expect(Config === undefined, 'Config falls back to undefined when schemastery is absent', String(Config))

const withDefault = load({ defaultZone: 'Asia/Tokyo' })
const tokyo = await withDefault.execute({})
expect(tokyo.endsWith('(Asia/Tokyo)'), 'configured defaultZone used when zone omitted', tokyo)

const explicit = await withDefault.execute({ zone: 'Europe/Berlin' })
expect(explicit.endsWith('(Europe/Berlin)'), 'explicit zone beats configured default', explicit)

const blank = load({ defaultZone: '  ' })
const system = await blank.execute({})
expect(!system.endsWith('(  )') && /\(.+\)$/.test(system), 'blank defaultZone falls back to host zone', system)

const noConfig = load(undefined)
const fallback = await noConfig.execute({})
expect(/\(.+\)$/.test(fallback), 'missing config still reports a zone', fallback)

let rejected = false
try {
  await withDefault.execute({ zone: 'Mars/Phobos' })
} catch (error) {
  rejected = /Unknown IANA time zone/.test(String(error?.message))
}
expect(rejected, 'unknown zone is a clean tool error')

const rendered = withDefault.output.render({}, tokyo)
expect(rendered[0]?.type === 'text' && rendered[0].text === tokyo, 'render returns one text block')

console.log('default  :', tokyo)
console.log('explicit :', explicit)
console.log('sys      :', system)
if (failures.length > 0) {
  console.error('FAIL\n' + failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('PASS: 10 checks')
}
