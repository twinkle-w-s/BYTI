import { shuffle, insertAtRandom, insertAfter } from './utils.js'

/**
 * 答题控制器
 */
export function createQuiz(questions, config, onComplete) {
  const specialGateConfig = config.specialGate || {}
  const gateEntry = questions.special.find((q) => q.id === specialGateConfig.entryQuestionId)
  const gateFollowup = questions.special.find((q) => q.id === specialGateConfig.followupQuestionId)

  let queue = buildQueue()
  let current = 0
  let answers = {}
  let specialResultCode = null

  const els = {
    fill: document.getElementById('progress-fill'),
    text: document.getElementById('progress-text'),
    qText: document.getElementById('question-text'),
    options: document.getElementById('options'),
  }

  function buildQueue() {
    const mainQuestions = shuffle(questions.main)
    if (!gateEntry) return mainQuestions

    if (specialGateConfig.entryInsertMode === 'random') {
      return insertAtRandom(mainQuestions, gateEntry)
    }

    return [gateEntry, ...mainQuestions]
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
    q.options.forEach((opt) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn-option'
      btn.textContent = opt.label
      btn.addEventListener('click', () => selectOption(q, opt))
      els.options.appendChild(btn)
    })

    updateProgress()
  }

  function handleSpecialRoute(question, option) {
    if (question.id !== specialGateConfig.entryQuestionId) return

    const route = specialGateConfig.routes?.[String(option.value)]
    if (!route) {
      specialResultCode = specialGateConfig.fallbackCode || null
      return
    }

    if (route.askFollowup && gateFollowup) {
      queue = insertAfter(queue, question.id, gateFollowup)
      return
    }

    specialResultCode = route.code || specialGateConfig.fallbackCode || null
  }

  function handleSpecialFollowup(question, option) {
    if (question.id !== specialGateConfig.followupQuestionId) return

    const entryAnswer = answers[specialGateConfig.entryQuestionId]
    const route = specialGateConfig.routes?.[String(entryAnswer)]
    if (!route) {
      specialResultCode = specialGateConfig.fallbackCode || null
      return
    }

    if (route.followupMinValue != null && option.value >= route.followupMinValue) {
      specialResultCode = route.code || specialGateConfig.fallbackCode || null
    } else {
      specialResultCode = specialGateConfig.fallbackCode || null
    }
  }

  function selectOption(question, option) {
    answers[question.id] = option.value

    handleSpecialRoute(question, option)
    handleSpecialFollowup(question, option)

    current++
    if (current >= totalCount()) {
      onComplete(answers, { specialResultCode })
    } else {
      renderQuestion()
    }
  }

  function start() {
    current = 0
    answers = {}
    specialResultCode = null
    queue = buildQueue()
    renderQuestion()
  }

  return { start, renderQuestion }
}
