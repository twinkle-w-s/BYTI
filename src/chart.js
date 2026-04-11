export function aggregateModelLevels(userLevels, dimensions) {
  const result = {}

  for (const [modelKey, model] of Object.entries(dimensions.models)) {
    const total = model.dimensions.reduce((sum, dim) => {
      const level = userLevels[dim] || 'M'
      return sum + (level === 'H' ? 3 : level === 'L' ? 1 : 2)
    }, 0)

    if (total <= 4) result[modelKey] = 'L'
    else if (total >= 8) result[modelKey] = 'H'
    else result[modelKey] = 'M'
  }

  return result
}

/**
 * 雷达图渲染 — Canvas API，无外部依赖
 */
const LEVEL_NUM = { L: 1, M: 2, H: 3 }

/**
 * 绘制 5 大模型雷达图
 * @param {HTMLCanvasElement} canvas
 * @param {Object} userLevels  { S1: 'H', S2: 'L', ... }
 * @param {Object} dimensions  完整维度配置
 */
export function drawRadar(canvas, userLevels, dimensions) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const size = 320
  canvas.width = size * dpr
  canvas.height = size * dpr
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  ctx.scale(dpr, dpr)

  const modelLevels = aggregateModelLevels(userLevels, dimensions)
  const modelOrder = Object.keys(dimensions.models)
  const labels = modelOrder.map((key) => dimensions.models[key].cn)

  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 44
  const n = modelOrder.length
  const angleStep = (Math.PI * 2) / n
  const startAngle = -Math.PI / 2

  ctx.clearRect(0, 0, size, size)

  for (let level = 3; level >= 1; level--) {
    const r = (level / 3) * maxR
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = level === 3 ? 'rgba(98, 241, 255, 0.05)' : level === 2 ? 'rgba(98, 241, 255, 0.03)' : 'rgba(98, 241, 255, 0.02)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(98, 241, 255, 0.11)'
    ctx.lineWidth = 0.7
    ctx.stroke()
  }

  ctx.font = '12px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(98, 241, 255, 0.11)'
    ctx.lineWidth = 0.7
    ctx.stroke()

    const labelR = maxR + 26
    const lx = cx + Math.cos(angle) * labelR
    const ly = cy + Math.sin(angle) * labelR
    ctx.fillStyle = '#9ba6b2'
    ctx.fillText(labels[i], lx, ly)
  }

  const values = modelOrder.map((key) => LEVEL_NUM[modelLevels[key]] || 2)

  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(98, 241, 255, 0.14)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(98, 241, 255, 0.68)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = i === 2 ? '#ef4fff' : '#62f1ff'
    ctx.fill()
  }
}
