import { aggregateModelLevels } from './chart.js'

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const LEVEL_LABEL = { L: '低', M: '中', H: '高' }

/**
 * 生成分享图片 — 纯 Canvas 绘制，无外部依赖
 */
export async function generateShareImage(primary, userLevels, dimensions, mode) {
  const dpr = 2
  const W = 720
  const H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const { order: dimOrder, definitions: dimDefs, models } = dimensions
  const modelLevels = aggregateModelLevels(userLevels, dimensions)
  const modelOrder = Object.keys(models)

  drawBackground(ctx, W, H)

  const cardX = 32
  const cardY = 32
  const cardW = W - 64
  const cardH = H - 64

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.42)'
  ctx.shadowBlur = 38
  ctx.shadowOffsetY = 18
  roundRect(ctx, cardX, cardY, cardW, cardH, 22)
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH)
  cardGradient.addColorStop(0, 'rgba(32, 35, 41, 0.96)')
  cardGradient.addColorStop(1, 'rgba(25, 27, 32, 0.96)')
  ctx.fillStyle = cardGradient
  ctx.fill()
  ctx.restore()

  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 22)
  ctx.clip()
  const glow = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  glow.addColorStop(0, 'rgba(98, 241, 255, 0.08)')
  glow.addColorStop(0.3, 'rgba(98, 241, 255, 0)')
  glow.addColorStop(1, 'rgba(239, 79, 255, 0.06)')
  ctx.fillStyle = glow
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.restore()

  ctx.strokeStyle = 'rgba(98, 241, 255, 0.16)'
  ctx.lineWidth = 1
  roundRect(ctx, cardX, cardY, cardW, cardH, 22)
  ctx.stroke()

  ctx.fillStyle = '#62f1ff'
  ctx.fillRect(cardX + 26, cardY + 18, 130, 2)
  ctx.fillStyle = '#ef4fff'
  ctx.fillRect(cardX + 158, cardY + 18, 26, 2)

  let y = cardY + 58

  ctx.textAlign = 'center'
  ctx.font = '400 20px Consolas, "Courier New", monospace'
  ctx.fillStyle = '#62f1ff'
  const kickerText = mode === 'special' ? 'HIDDEN DIAGNOSTIC ACTIVE' : mode === 'fallback' ? 'SYSTEM ABNORMAL ARCHIVE' : 'MENTAL DIAGNOSTIC REPORT'
  ctx.fillText(kickerText, W / 2, y)
  y += 54

  ctx.font = '700 74px Bahnschrift, "DIN Alternate", "Arial Narrow", sans-serif'
  ctx.fillStyle = '#f2f5f7'
  ctx.shadowColor = 'rgba(98, 241, 255, 0.14)'
  ctx.shadowBlur = 16
  ctx.fillText(primary.code, W / 2, y)
  ctx.shadowColor = 'transparent'
  y += 42

  ctx.font = '700 30px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.fillStyle = '#ef4fff'
  ctx.fillText(primary.cn, W / 2, y)
  y += 38

  const badgeText = `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')
  ctx.font = '600 18px "Microsoft YaHei", "PingFang SC", sans-serif'
  const badgeW = ctx.measureText(badgeText).width + 38
  roundRect(ctx, (W - badgeW) / 2, y - 16, badgeW, 34, 17)
  ctx.fillStyle = 'rgba(98, 241, 255, 0.1)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(98, 241, 255, 0.18)'
  ctx.stroke()
  ctx.fillStyle = '#62f1ff'
  ctx.fillText(badgeText, W / 2, y + 5)
  y += 44

  ctx.font = 'italic 600 22px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.fillStyle = '#f2f5f7'
  const introLines = wrapText(ctx, primary.intro || '', cardW - 80)
  for (const line of introLines) {
    ctx.fillText(line, W / 2, y)
    y += 30
  }
  y += 16

  const radarCx = W / 2
  const radarCy = y + 138
  const radarR = 124
  drawShareRadar(ctx, radarCx, radarCy, radarR, modelLevels, modelOrder, models)
  y = radarCy + radarR + 36

  ctx.textAlign = 'left'
  const boxX = cardX + 42
  const boxW = cardW - 84
  const boxH = 118
  roundRect(ctx, boxX, y, boxW, boxH, 14)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(98, 241, 255, 0.12)'
  ctx.stroke()

  ctx.font = '700 15px Bahnschrift, "DIN Alternate", sans-serif'
  ctx.fillStyle = '#f2f5f7'
  ctx.fillText('五大模块剖面', boxX + 18, y + 24)

  let rowY = y + 50
  for (const modelKey of modelOrder) {
    const model = models[modelKey]
    const level = modelLevels[modelKey]
    ctx.font = '600 14px "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.fillStyle = '#9ba6b2'
    ctx.fillText(model.cn, boxX + 18, rowY)

    ctx.textAlign = 'right'
    ctx.font = '700 13px Consolas, "Courier New", monospace'
    ctx.fillStyle = level === 'H' ? '#ef4fff' : level === 'M' ? '#62f1ff' : '#ffe85a'
    ctx.fillText(LEVEL_LABEL[level], boxX + boxW - 18, rowY)
    ctx.textAlign = 'left'

    rowY += 18
  }

  y += boxH + 26

  ctx.textAlign = 'left'
  const barX = cardX + 48
  const barMaxW = cardW - 96
  const dimNameW = 134
  const valuePad = 56

  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const val = LEVEL_NUM[level]
    const def = dimDefs[dim]
    if (!def) continue

    const name = def.name.replace(/^[A-Za-z0-9]+\s*/, '')

    ctx.font = '600 14px "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.fillStyle = '#f2f5f7'
    const safeName = fitText(ctx, name, dimNameW - 8)
    ctx.fillText(safeName, barX, y)

    const progX = barX + dimNameW
    const progW = barMaxW - dimNameW - valuePad
    const progH = 12
    roundRect(ctx, progX, y - 10, progW, progH, 6)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.fill()

    const fillW = (val / 3) * progW
    roundRect(ctx, progX, y - 10, fillW, progH, 6)
    ctx.fillStyle = val === 3 ? '#ef4fff' : val === 2 ? '#62f1ff' : '#ffe85a'
    ctx.fill()

    ctx.textAlign = 'right'
    ctx.font = '700 13px Consolas, "Courier New", monospace'
    ctx.fillStyle = val === 3 ? '#ef4fff' : val === 2 ? '#62f1ff' : '#ffe85a'
    ctx.fillText(LEVEL_LABEL[level], barX + barMaxW, y)
    ctx.textAlign = 'left'

    y += 26
  }

  ctx.textAlign = 'center'
  ctx.font = '400 16px Consolas, "Courier New", monospace'
  ctx.fillStyle = '#6e7783'
  ctx.fillText('BYTI // cyber archive // for fun only', W / 2, H - cardY - 24)

  const link = document.createElement('a')
  link.download = `BYTI-${primary.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function drawBackground(ctx, W, H) {
  ctx.fillStyle = '#111214'
  ctx.fillRect(0, 0, W, H)

  const glowTop = ctx.createRadialGradient(W / 2, 110, 0, W / 2, 110, 300)
  glowTop.addColorStop(0, 'rgba(98, 241, 255, 0.12)')
  glowTop.addColorStop(1, 'rgba(98, 241, 255, 0)')
  ctx.fillStyle = glowTop
  ctx.fillRect(0, 0, W, H)

  const glowSide = ctx.createRadialGradient(W * 0.86, H * 0.22, 0, W * 0.86, H * 0.22, 220)
  glowSide.addColorStop(0, 'rgba(239, 79, 255, 0.1)')
  glowSide.addColorStop(1, 'rgba(239, 79, 255, 0)')
  ctx.fillStyle = glowSide
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(98, 241, 255, 0.04)'
  ctx.lineWidth = 1
  for (let x = 0; x <= W; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += 28) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  for (let y = 0; y <= H; y += 5) {
    ctx.fillStyle = 'rgba(255,255,255,0.008)'
    ctx.fillRect(0, y, W, 1)
  }
}

function drawShareRadar(ctx, cx, cy, maxR, modelLevels, modelOrder, models) {
  const n = modelOrder.length
  const step = (Math.PI * 2) / n
  const start = -Math.PI / 2

  for (let lv = 3; lv >= 1; lv--) {
    const r = (lv / 3) * maxR
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const angle = start + i * step
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fillStyle = lv === 3 ? 'rgba(98,241,255,0.05)' : lv === 2 ? 'rgba(98,241,255,0.035)' : 'rgba(98,241,255,0.02)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(98,241,255,0.1)'
    ctx.lineWidth = 0.6
    ctx.stroke()
  }

  ctx.font = '400 12px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const x = cx + Math.cos(angle) * maxR
    const y = cy + Math.sin(angle) * maxR
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.strokeStyle = 'rgba(98,241,255,0.08)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    const lr = maxR + 28
    const lx = cx + Math.cos(angle) * lr
    const ly = cy + Math.sin(angle) * lr
    drawRadarLabel(ctx, models[modelOrder[i]].cn, lx, ly, angle)
  }

  const values = modelOrder.map((key) => LEVEL_NUM[modelLevels[key]] || 2)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = 'rgba(98,241,255,0.14)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(98,241,255,0.6)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = i === 2 ? '#ef4fff' : '#62f1ff'
    ctx.fill()
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return []
  const lines = []
  let line = ''
  for (const char of text) {
    const test = line + char
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let fitted = text
  while (fitted.length > 1 && ctx.measureText(fitted + '…').width > maxWidth) {
    fitted = fitted.slice(0, -1)
  }
  return fitted + '…'
}

function drawRadarLabel(ctx, text, x, y, angle) {
  const isTop = Math.sin(angle) < -0.7
  const isBottom = Math.sin(angle) > 0.7
  const isRight = Math.cos(angle) > 0.45
  const isLeft = Math.cos(angle) < -0.45

  if (isTop) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
  } else if (isBottom) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
  } else if (isRight) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
  } else if (isLeft) {
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
  } else {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
  }

  ctx.fillStyle = '#9ba6b2'
  ctx.fillText(text, x, y)
}
