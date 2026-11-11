/**
 * Browser half of the dsh-clock bundle.
 *
 * Draws a compact chip in `conversation.composer.dock`. It shows the time this
 * page has been open and toggles to the local wall clock on click. Text is
 * digits only, so the chip needs no dictionary beyond the inventory metadata;
 * colors inherit the host theme through `currentColor`.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-clock',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const chip = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 8px',
      borderRadius: 999,
      border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
      background: 'color-mix(in srgb, currentColor 6%, transparent)',
      color: 'inherit',
      font: 'inherit',
      fontSize: 11,
      lineHeight: 1.6,
      fontVariantNumeric: 'tabular-nums',
      cursor: 'pointer',
      userSelect: 'none',
    }

    const pad = n => String(n).padStart(2, '0')

    function since(start) {
      const total = Math.max(0, Math.floor((Date.now() - start) / 1000))
      const hours = Math.floor(total / 3600)
      const minutes = Math.floor((total % 3600) / 60)
      const seconds = total % 60
      return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
    }

    function wallClock(now) {
      const date = new Date(now)
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    function ClockChip() {
      const start = React.useRef(Date.now())
      const [now, setNow] = React.useState(() => Date.now())
      const [wallClockMode, setWallClockMode] = React.useState(false)

      React.useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
      }, [])

      const text = wallClockMode ? wallClock(now) : since(start.current)

      return h(
        'button',
        {
          type: 'button',
          style: chip,
          onClick: () => setWallClockMode(value => !value),
        },
        h(
          'svg',
          {
            width: 12,
            height: 12,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
            strokeLinecap: 'round',
            'aria-hidden': true,
            style: { display: 'block', flex: 'none' },
          },
          h('circle', { cx: 12, cy: 12, r: 9 }),
          h('path', { d: 'M12 7v5l3 2' }),
        ),
        h('span', null, text),
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            { name: 'conversation.composer.dock', id: 'dsh-clock', order: 5 },
            ClockChip,
          ),
        )
      },
    }
  },
})
