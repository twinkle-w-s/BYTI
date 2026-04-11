import { drawRadar } from './chart.js'
import { generateShareImage } from './share.js'

const LEVEL_LABEL = { L: '低', M: '中', H: '高' }
const LEVEL_CLASS = { L: 'level-low', M: 'level-mid', H: 'level-high' }

/**
 * 渲染测试结果
 */
export function renderResult(result, userLevels, dimensions, config) {
  const { primary, mode } = result
  const { order: dimOrder, definitions: dimDefs, models } = dimensions

  // Kicker
  const kicker = document.getElementById('result-kicker')
  if (mode === 'special') kicker.textContent = '隐藏诊断已触发'
  else if (mode === 'fallback') kicker.textContent = '系统异常归档'
  else kicker.textContent = '人格诊断报告'

  // 主类型
  document.getElementById('result-code').textContent = primary.code
  document.getElementById('result-name').textContent = primary.cn

  // 匹配度
  document.getElementById('result-badge').textContent =
    `匹配度 ${primary.similarity}%` + (primary.exact != null ? ` · 精准命中 ${primary.exact}/15 维` : '')

  // Intro & 描述
  document.getElementById('result-intro').textContent = primary.intro || ''
  document.getElementById('result-desc').textContent = primary.desc || ''

  // 保留单一最佳匹配
  const secEl = document.getElementById('result-secondary')
  secEl.style.display = 'none'

  // 雷达图
  const canvas = document.getElementById('radar-chart')
  drawRadar(canvas, userLevels, dimensions)

  // 五大模型摘要
  const summaryEl = document.getElementById('model-summary')
  summaryEl.innerHTML = ''
  for (const model of Object.values(models)) {
    const levels = model.dimensions.map((dim) => userLevels[dim] || 'M')
    const score = levels.reduce((sum, level) => sum + (level === 'H' ? 3 : level === 'L' ? 1 : 2), 0)
    const modelLevel = score <= 4 ? 'L' : score >= 8 ? 'H' : 'M'

    const item = document.createElement('div')
    item.className = 'model-item'
    item.innerHTML = `
      <div class="model-item-head">
        <span class="model-item-name">${model.cn}</span>
        <span class="dim-level ${LEVEL_CLASS[modelLevel]}">${LEVEL_LABEL[modelLevel]}</span>
      </div>
      <div class="model-item-sub">${model.dimensions.join(' / ')}</div>
    `
    summaryEl.appendChild(item)
  }

  // 维度详情
  const detailEl = document.getElementById('dimensions-detail')
  detailEl.innerHTML = ''
  for (const dim of dimOrder) {
    const level = userLevels[dim] || 'M'
    const def = dimDefs[dim]
    if (!def) continue

    const row = document.createElement('div')
    row.className = 'dim-row'
    row.innerHTML = `
      <div class="dim-header">
        <span class="dim-name">${def.name}</span>
        <span class="dim-level ${LEVEL_CLASS[level]}">${LEVEL_LABEL[level]}</span>
      </div>
      <div class="dim-desc">${def.levels[level]}</div>
    `
    detailEl.appendChild(row)
  }

  // 免责声明
  document.getElementById('disclaimer').textContent =
    mode === 'normal' ? config.display.funNote : config.display.funNoteSpecial

  // 下载分享图
  const btnDownload = document.getElementById('btn-download')
  btnDownload.onclick = () => {
    generateShareImage(primary, userLevels, dimensions, mode)
  }

  // 复制 AI Agent 命令
  const btnAgent = document.getElementById('btn-agent')
  btnAgent.onclick = () => {
    const cmd = `git clone https://github.com/pingfanfan/SBTI.git && cd SBTI && npm install && npm run dev`
    navigator.clipboard.writeText(cmd).then(() => {
      btnAgent.textContent = '已复制!'
      setTimeout(() => { btnAgent.textContent = '复制一键部署命令' }, 2000)
    })
  }
}
