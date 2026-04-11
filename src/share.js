/**
 * 生成分享图片 — 纯 Canvas 绘制，无外部依赖
 */

const LEVEL_NUM = { L: 1, M: 2, H: 3 }
const LEVEL_LABEL = { L: '低', M: '中', H: '高' }

/**
 * 生成分享卡片并下载
 */
export async function generateShareImage(primary, userLevels, dimOrder, dimDefs, mode) {
  const dpr = 2
  const W = 720
  const H = 1280
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  drawBackground(ctx, W, H)

  const cardX = 32
  const cardY = 32
  const cardW = W - 64
  const cardH = H - 64

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.48)'
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 20
  roundRect(ctx, cardX, cardY, cardW, cardH, 22)
  ctx.fillStyle = 'rgba(19, 23, 24, 0.94)'
  ctx.fill()
  ctx.restore()

  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 22)
  ctx.clip()
  const glow = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH)
  glow.addColorStop(0, 'rgba(156, 255, 87, 0.08)')
  glow.addColorStop(0.45, 'rgba(0, 0, 0, 0)')
  glow.addColorStop(1, 'rgba(255, 93, 93, 0.06)')
  ctx.fillStyle = glow
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.restore()

  ctx.strokeStyle = 'rgba(163, 255, 208, 0.2)'
  ctx.lineWidth = 1
  roundRect(ctx, cardX, cardY, cardW, cardH, 22)
  ctx.stroke()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cardX + 18, cardY + 18, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#9cff57'
  ctx.shadowColor = 'rgba(156, 255, 87, 0.6)'
  ctx.shadowBlur = 18
  ctx.fill()
  ctx.restore()

  let y = cardY + 54

  ctx.textAlign = 'center'
  ctx.font = '400 20px Consolas, "Courier New", monospace'
  ctx.fillStyle = '#ff9a3c'
  const kickerText = mode === 'special' ? '[ hidden profile activated ]' : mode === 'fallback' ? '[ system force fallback ]' : '[ profile scan complete ]'
  ctx.fillText(kickerText, W / 2, y)
  y += 54

  ctx.font = '700 74px Bahnschrift, "DIN Alternate", "Arial Narrow", sans-serif'
  ctx.fillStyle = '#9cff57'
  ctx.shadowColor = 'rgba(156, 255, 87, 0.16)'
  ctx.shadowBlur = 18
  ctx.fillText(primary.code, W / 2, y)
  ctx.shadowColor = 'transparent'
  y += 42

  ctx.font = '600 30px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.fillStyle = '#e8eadf'
  ctx.fillText(primary.cn, W / 2, y)
  y += 38

  const badgeText = `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')
  ctx.font = '600 18px "Microsoft YaHei", "PingFang SC", sans-serif'
  const badgeW = ctx.measureText(badgeText).width + 38
  roundRect(ctx, (W - badgeW) / 2, y - 16, badgeW, 34, 17)
  ctx.fillStyle = 'rgba(156, 255, 87, 0.1)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(156, 255, 87, 0.16)'
  ctx.stroke()
  ctx.fillStyle = '#9cff57'
  ctx.fillText(badgeText, W / 2, y + 5)
  y += 44

  ctx.font = 'italic 600 22px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.fillStyle = '#e8eadf'
  const introLines = wrapText(ctx, primary.intro || '', cardW - 80)
  for (const line of introLines) {
    ctx.fillText(line, W / 2, y)
    y += 30
  }
  y += 16

  const radarCx = W / 2
  const radarCy = y + 150
  const radarR = 130
  drawShareRadar(ctx, radarCx, radarCy, radarR, userLevels, dimOrder, dimDefs)
  y = radarCy + radarR + 42

  ctx.textAlign = 'left'
  const barX = cardX + 48
  const barMaxW = cardW - 96
  const dimNameW = 110

  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const val = LEVEL_NUM[level]
    const def = dimDefs[dim]
    if (!def) continue

    const name = def.name.replace(/^[A-Za-z0-9]+\s*/, '')

    ctx.font = '600 16px "Microsoft YaHei", "PingFang SC", sans-serif'
    ctx.fillStyle = '#e8eadf'
    ctx.fillText(name, barX, y)

    const progX = barX + dimNameW
    const progW = barMaxW - dimNameW - 50
    const progH = 12
    roundRect(ctx, progX, y - 10, progW, progH, 6)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.fill()

    const fillW = (val / 3) * progW
    roundRect(ctx, progX, y - 10, fillW, progH, 6)
    ctx.fillStyle = val === 3 ? '#9cff57' : val === 2 ? '#c6d0be' : '#ff9a3c'
    ctx.fill()

    ctx.textAlign = 'right'
    ctx.font = '700 13px Consolas, "Courier New", monospace'
    ctx.fillStyle = val === 3 ? '#9cff57' : val === 2 ? '#c6d0be' : '#ff9a3c'
    ctx.fillText(LEVEL_LABEL[level], barX + barMaxW, y)
    ctx.textAlign = 'left'

    y += 26
  }

  y += 16

  ctx.textAlign = 'center'
  ctx.font = '400 16px Consolas, "Courier New", monospace'
  ctx.fillStyle = '#8e9686'
  ctx.fillText('BYTI // mental state archive // for fun only', W / 2, H - cardY - 24)

  const link = document.createElement('a')
  link.download = `BYTI-${primary.code}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function drawBackground(ctx, W, H) {
  ctx.fillStyle = '#0d0f10'
  ctx.fillRect(0, 0, W, H)

  const topGlow = ctx.createRadialGradient(W / 2, 120, 0, W / 2, 120, 280)
  topGlow.addColorStop(0, 'rgba(156, 255, 87, 0.12)')
  topGlow.addColorStop(1, 'rgba(156, 255, 87, 0)')
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, W, H)

  const sideGlow = ctx.createRadialGradient(W * 0.86, H * 0.18, 0, W * 0.86, H * 0.18, 220)
  sideGlow.addColorStop(0, 'rgba(255, 93, 93, 0.1)')
  sideGlow.addColorStop(1, 'rgba(255, 93, 93, 0)')
  ctx.fillStyle = sideGlow
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(138, 255, 196, 0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x <= W; x += 26) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += 26) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  for (let y = 0; y <= H; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.006)'
    ctx.fillRect(0, y, W, 1)
  }

  ctx.save()
  ctx.globalAlpha = 0.18
  ctx.filter = 'blur(22px)'
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath()
  ctx.ellipse(W / 2, 240, 130, 70, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * 在分享图上绘制雷达图
 */
function drawShareRadar(ctx, cx, cy, maxR, userLevels, dimOrder, dimDefs) {
  const n = dimOrder.length
  const step = (Math.PI * 2) / n
  const start = -Math.PI / 2

  for (let lv = 3; lv >= 1; lv--) {
    const r = (lv / 3) * maxR
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = lv === 3 ? 'rgba(156,255,87,0.06)' : lv === 2 ? 'rgba(156,255,87,0.04)' : 'rgba(156,255,87,0.02)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(156,255,87,0.12)'
    ctx.lineWidth = 0.5
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
    ctx.strokeStyle = 'rgba(156,255,87,0.1)'
    ctx.lineWidth = 0.5
    ctx.stroke()

    const lr = maxR + 24
    const lx = cx + Math.cos(angle) * lr
    const ly = cy + Math.sin(angle) * lr
    const label = (dimDefs[dimOrder[i]]?.name || dimOrder[i]).replace(/^[A-Za-z0-9]+\s*/, '')
    ctx.fillStyle = '#8e9686'
    ctx.fillText(label, lx, ly)
  }

  const values = dimOrder.map((d) => LEVEL_NUM[userLevels[d]] || 2)
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
  ctx.fillStyle = 'rgba(156,255,87,0.16)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(156,255,87,0.6)'
  ctx.lineWidth = 2
  ctx.stroke()

  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    const r = (values[i] / 3) * maxR
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#9cff57'
    ctx.fill()
  }
}

/**
 * 圆角矩形
 */
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

/**
 * 文字自动换行
 */
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
