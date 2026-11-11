/**
 * Host half of the dsh-clock bundle.
 *
 * Registers one model-facing tool, `local_time`, that reports the current
 * wall-clock time in any IANA time zone. The browser half lives in `client.js`
 * and only draws the composer-dock chip, so the two halves stay independent.
 *
 * The bundle imports nothing at load time: every shipped dsh package resolves
 * from the dsh installation, and the tool registry accepts a plain JSON Schema
 * definition. The one optional import, schemastery for the settings schema,
 * is probed at activation so a bundle linked from outside the profile still
 * loads when that package cannot be resolved.
 */

export const name = 'dsh-clock'
export const inject = ['tools']

let Schema
try {
  Schema = (await import('@deepseek-ai/schemastery')).default
} catch {
  Schema = undefined
}

/**
 * The optional `defaultZone` setting. It is a settings-panel field, so it is
 * only offered when schemastery resolves; without it the plugin behaves as if
 * the setting were empty and falls back to the host system zone.
 */
function buildConfig() {
  if (Schema === undefined) return undefined
  try {
    let field = Schema.string().default('')
    if (typeof field.description === 'function') {
      field = field.description(
        'IANA time zone reported when a call omits zone, for example Asia/Tokyo. Empty means the host system zone.',
      )
    }
    return Schema.object({ defaultZone: field })
  } catch {
    return undefined
  }
}

export const Config = buildConfig()

/** IANA zone ids are validated by Intl at call time; this only guards the shape. */
const PARAMETERS = {
  type: 'object',
  properties: {
    zone: {
      type: 'string',
      description:
        'IANA time zone id to report, for example Asia/Tokyo or America/New_York. Omit to use the configured default zone, or the host system zone.',
    },
  },
  additionalProperties: false,
}

const OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/** The host's own zone, used when neither the call nor the setting names one. */
function systemZone() {
  try {
    const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone
    return typeof zone === 'string' && zone !== '' ? zone : 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Format one zone as `YYYY-MM-DD HH:MM:SS GMT+8 (Asia/Shanghai)`.
 * Throws a RangeError from Intl for an unknown zone id.
 */
function stamp(zone) {
  const now = new Date()
  const dateTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
  const offset =
    new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset', hour: '2-digit' })
      .formatToParts(now)
      .find(part => part.type === 'timeZoneName')?.value ?? 'GMT'
  return `${dateTime} ${offset} (${zone})`
}

export function apply(ctx, config) {
  const configured = typeof config?.defaultZone === 'string' ? config.defaultZone.trim() : ''

  ctx.tools.register({
    name: 'local_time',
    description:
      "Report the current date and time in an IANA time zone. Use it when the user asks what time it is somewhere other than the zone of this session's time context; without a zone argument it reports this plugin's configured default zone, or the host's own zone.",
    parameters: PARAMETERS,
    output: OUTPUT,
    async execute(args) {
      const requested = typeof args?.zone === 'string' ? args.zone.trim() : ''
      const zone = requested !== '' ? requested : configured !== '' ? configured : systemZone()
      try {
        return stamp(zone)
      } catch {
        throw new Error(`Unknown IANA time zone "${zone}".`)
      }
    },
  })
}
