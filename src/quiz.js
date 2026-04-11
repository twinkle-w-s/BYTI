import { shuffle } from './utils.js'

/**
 * 答题控制器
 */
export function createQuiz(questions, config, onComplete) {
  let queue = buildQueue()
  let current = 0
  let answers = {}

  const els = {
    fill: document.getElementById('progress-fill'),
    text: document.getElementById('progress-text'),
    qText: document.getElementById('question-text'),
    options: document.getElementById('options'),
  }

  function buildQueue() {
    return shuffle(questions.main)
  }

  function totalCount() {
    return queue.length
  }

  function updateProgress() {
    const pct = (current / totalCount()) * 100
    els.fill.style.width = pct + '%'
    els.text.textContent = `${current} / ${totalCount()}`
  }

  function renderQuestion() {
    const q = queue[current]
    els.qText.textContent = q.text

    els.options.innerHTML = ''
    q.options.forEach((opt, index) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn-option'
      btn.innerHTML = `<span class="option-index">${String(index + 1).padStart(2, '0')}</span><span class="option-text">${opt.label}</span>`
      btn.addEventListener('click', () => selectOption(q, opt))
      els.options.appendChild(btn)
    })

    updateProgress()
  }

  function selectOption(question, option) {
    answers[question.id] = option.value

    current++
    if (current >= totalCount()) {
      onComplete(answers)
    } else {
      renderQuestion()
    }
  }

  function start() {
    current = 0
    answers = {}
    queue = buildQueue()
    renderQuestion()
  }

  return { start, renderQuestion }
}
