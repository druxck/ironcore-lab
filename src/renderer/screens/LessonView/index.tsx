import { useEffect, useRef, useState } from 'react'
import type { Exercise, HistoryCard, Lesson } from '@shared/content-types'
import type { PipelineMode, RunResult } from '@shared/run-types'
import { useContentStore } from '../../state/useContentStore'
import { useSaveStore } from '../../state/useSaveStore'
import { useToastStore } from '../../state/useToastStore'
import Markdown from '../../components/Markdown'
import HistoryCallout from '../../components/HistoryCallout'
import EditorPanel from './EditorPanel'
import OutputPanel from './OutputPanel'

interface Props {
  lessonId: string
  onBackToMap: () => void
}

async function runCompileAndRun(exercise: Exercise, sourceCode: string, mode: PipelineMode): Promise<RunResult> {
  return window.lab.invoke('run:compileAndRun', {
    exerciseId: exercise.id,
    sourceCode,
    mode,
    timeoutSeconds: exercise.timeoutSeconds,
    memoryLimitMb: exercise.memoryLimitMb
  })
}

export default function LessonView({ lessonId, onBackToMap }: Props): JSX.Element {
  const getExercisesForLesson = useContentStore((s) => s.getExercisesForLesson)
  const getLessonNarrative = useContentStore((s) => s.getLessonNarrative)
  const getHistoryCards = useContentStore((s) => s.getHistoryCards)
  const findLesson = useContentStore((s) => s.findLesson)
  const achievements = useContentStore((s) => s.achievements)
  const submitExerciseResult = useSaveStore((s) => s.submitExerciseResult)
  const save = useSaveStore((s) => s.save)
  const pushToast = useToastStore((s) => s.push)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [narrative, setNarrative] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [historyCards, setHistoryCards] = useState<HistoryCard[]>([])
  const [exerciseIndex, setExerciseIndex] = useState(0)

  useEffect(() => {
    setLesson(findLesson(lessonId) ?? null)
    void (async () => {
      const [md, ex] = await Promise.all([getLessonNarrative(lessonId), getExercisesForLesson(lessonId)])
      setNarrative(md)
      setExercises(ex)
      setExerciseIndex(0)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId])

  useEffect(() => {
    const found = findLesson(lessonId)
    if (found?.historyCardIds?.length) {
      void getHistoryCards(found.historyCardIds).then(setHistoryCards)
    } else {
      setHistoryCards([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson])

  if (!lesson) {
    return <div className="p-6 text-lab-phosphorDim">Loading lesson…</div>
  }

  const exercise = exercises[exerciseIndex]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <button type="button" onClick={onBackToMap} className="text-xs text-lab-phosphorDim hover:text-lab-phosphor">
        ← Back to Lab Map
      </button>

      <div>
        <div className="text-xs uppercase tracking-widest text-lab-phosphorDim">
          Lesson {lesson.order} · {lesson.estXp} XP
        </div>
        <h1 className="glow-text-phosphor font-blueprint text-2xl text-lab-phosphor">{lesson.title}</h1>
        <ul className="mt-2 flex flex-wrap gap-2">
          {lesson.objectives.map((obj) => (
            <li key={obj} className="rounded-full border border-lab-wire px-2 py-0.5 text-xs text-lab-phosphorDim">
              {obj}
            </li>
          ))}
        </ul>
      </div>

      <Markdown content={narrative} />

      {historyCards.map((card) => (
        <HistoryCallout key={card.id} card={card} />
      ))}

      {exercises.length > 1 && (
        <div className="flex gap-1 border-b border-lab-wire pb-2">
          {exercises.map((ex, idx) => {
            const completed = save?.progress.exercisesCompleted[ex.id]?.passedAt
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExerciseIndex(idx)}
                className={`rounded px-2 py-1 text-xs ${
                  idx === exerciseIndex
                    ? 'bg-lab-phosphorDim/30 text-lab-phosphor'
                    : completed
                      ? 'text-lab-phosphor/70'
                      : 'text-lab-phosphorDim hover:text-lab-phosphor'
                }`}
              >
                {completed ? '✔ ' : ''}
                {idx + 1}
              </button>
            )
          })}
        </div>
      )}

      {exercise && (
        <ExercisePanel
          key={exercise.id}
          exercise={exercise}
          onGraded={(award) => {
            if (award.xpAwarded > 0) {
              pushToast({ kind: 'xp', title: `+${award.xpAwarded} XP`, detail: exercise.title })
            }
            if (award.lessonCompleted) {
              pushToast({ kind: 'lesson', title: 'Lesson restored', detail: lesson.title })
            }
            for (const id of award.newlyUnlockedAchievements) {
              const a = achievements.find((ach) => ach.id === id)
              pushToast({ kind: 'achievement', title: a?.title ?? 'Achievement unlocked', detail: a?.description })
            }
          }}
          onSubmit={(exerciseId, result) => submitExerciseResult(exerciseId, result)}
        />
      )}
    </div>
  )
}

interface AwardSummary {
  xpAwarded: number
  newlyUnlockedAchievements: string[]
  lessonCompleted: boolean
  arcRestorationPct: number
}

interface ExercisePanelProps {
  exercise: Exercise
  onGraded: (award: AwardSummary) => void
  onSubmit: (exerciseId: string, result: RunResult) => Promise<AwardSummary>
}

function ExercisePanel({ exercise, onGraded, onSubmit }: ExercisePanelProps): JSX.Element {
  const passedAlready = useSaveStore((s) => Boolean(s.save?.progress.exercisesCompleted[exercise.id]?.passedAt))

  if (exercise.type === 'predict-output' || exercise.type === 'fill-in-blank') {
    return <AnswerExercise exercise={exercise} passedAlready={passedAlready} onGraded={onGraded} onSubmit={onSubmit} />
  }
  if (exercise.type === 'debug-with-gdb') {
    return <GdbExercise exercise={exercise} passedAlready={passedAlready} onGraded={onGraded} onSubmit={onSubmit} />
  }
  return <CodeExercise exercise={exercise} passedAlready={passedAlready} onGraded={onGraded} onSubmit={onSubmit} />
}

function ExerciseHeader({ exercise, passedAlready }: { exercise: Exercise; passedAlready: boolean }): JSX.Element {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-lab-phosphor">
        {exercise.title} {passedAlready && <span className="text-lab-phosphor/70">✔</span>}
      </h2>
      <span className="text-xs text-lab-phosphorDim">{exercise.baseXp} XP</span>
    </div>
  )
}

function CodeExercise({ exercise, passedAlready, onGraded, onSubmit }: ExercisePanelProps & { passedAlready: boolean }): JSX.Element {
  const [code, setCode] = useState(exercise.starterCode)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void (async () => {
      const { sourceCode } = await window.lab.invoke('save:loadWorkspace', { exerciseId: exercise.id })
      setCode(sourceCode ?? exercise.starterCode)
      setResult(null)
    })()
  }, [exercise.id, exercise.starterCode])

  function handleChange(next: string): void {
    setCode(next)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void window.lab.invoke('save:autosaveWorkspace', { exerciseId: exercise.id, sourceCode: next })
    }, 800)
  }

  async function handleRun(): Promise<void> {
    setIsRunning(true)
    try {
      const runResult = await runCompileAndRun(exercise, code, 'run')
      setResult(runResult)
    } finally {
      setIsRunning(false)
    }
  }

  async function handleSubmit(): Promise<void> {
    setIsRunning(true)
    try {
      let testResult = await runCompileAndRun(exercise, code, 'test')
      if (exercise.gradingCriteria.includes('valgrind-clean') && testResult.outcome === 'completed') {
        const valgrindResult = await runCompileAndRun(exercise, code, 'valgrind')
        testResult = { ...testResult, valgrindSummary: valgrindResult.valgrindSummary }
      }
      setResult(testResult)
      const award = await onSubmit(exercise.id, testResult)
      onGraded(award)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="rounded border border-lab-wire bg-lab-panel/40 p-4">
      <ExerciseHeader exercise={exercise} passedAlready={passedAlready} />
      <p className="mb-3 text-sm text-lab-phosphorDim">{exercise.prompt}</p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <EditorPanel value={code} onChange={handleChange} diagnostics={result?.diagnostics ?? []} />
        <OutputPanel result={result} isRunning={isRunning} />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          className="rounded border border-lab-phosphorDim/60 px-3 py-1.5 text-xs text-lab-phosphor hover:bg-lab-phosphorDim/20 disabled:opacity-50"
        >
          Run
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isRunning}
          className="rounded border border-lab-amber/60 px-3 py-1.5 text-xs text-lab-amber hover:bg-lab-amber/10 disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

function buildAnswerResult(answer: string, expected: string): RunResult {
  const passed = answer.trim().toLowerCase() === expected.trim().toLowerCase()
  return {
    mode: 'run',
    outcome: 'completed',
    exitCode: 0,
    signal: null,
    stdout: answer,
    stderr: '',
    compileLog: '',
    diagnostics: [],
    sanitizerFindings: [],
    testResults: [
      {
        testId: 'answer',
        passed,
        hidden: false,
        actualStdout: answer,
        expectedStdout: expected,
        description: 'Your answer'
      }
    ],
    durationMs: 0,
    friendlyMessage: passed ? 'Correct.' : 'Not quite - reread the narrative above and try again.'
  }
}

function AnswerExercise({ exercise, passedAlready, onGraded, onSubmit }: ExercisePanelProps & { passedAlready: boolean }): JSX.Element {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(): Promise<void> {
    setSubmitting(true)
    try {
      const graded = buildAnswerResult(answer, exercise.expectedAnswer ?? '')
      setResult(graded)
      const award = await onSubmit(exercise.id, graded)
      onGraded(award)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded border border-lab-wire bg-lab-panel/40 p-4">
      <ExerciseHeader exercise={exercise} passedAlready={passedAlready} />
      <p className="mb-3 text-sm text-lab-phosphorDim">{exercise.prompt}</p>
      {exercise.starterCode && (
        <pre className="mb-3 overflow-x-auto rounded border border-lab-wire bg-black/50 p-3 text-xs text-lab-phosphor">
          {exercise.starterCode}
        </pre>
      )}
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer…"
        className="w-full rounded border border-lab-wire bg-black/40 p-2 text-sm text-lab-phosphor outline-none focus:border-lab-phosphorDim"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || answer.trim() === ''}
          className="rounded border border-lab-amber/60 px-3 py-1.5 text-xs text-lab-amber hover:bg-lab-amber/10 disabled:opacity-50"
        >
          Submit
        </button>
        {result && (
          <span className={result.testResults?.[0]?.passed ? 'text-lab-phosphor' : 'text-lab-alert'}>
            {result.friendlyMessage}
          </span>
        )}
      </div>
    </div>
  )
}

function GdbExercise({ exercise, passedAlready, onGraded, onSubmit }: ExercisePanelProps & { passedAlready: boolean }): JSX.Element {
  const [transcript, setTranscript] = useState<RunResult | null>(null)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)

  async function handleRunDebugger(): Promise<void> {
    setBusy(true)
    try {
      const gdbResult = await runCompileAndRun(exercise, exercise.starterCode, 'gdb-batch')
      setTranscript(gdbResult)
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!transcript) return
    setBusy(true)
    try {
      const passed = answer.trim().toLowerCase() === (exercise.expectedAnswer ?? '').trim().toLowerCase()
      const graded: RunResult = {
        ...transcript,
        testResults: [
          {
            testId: 'gdb-answer',
            passed,
            hidden: false,
            actualStdout: answer,
            expectedStdout: exercise.expectedAnswer ?? '',
            description: 'Debugger diagnosis'
          }
        ]
      }
      setResult(graded)
      const award = await onSubmit(exercise.id, graded)
      onGraded(award)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded border border-lab-wire bg-lab-panel/40 p-4">
      <ExerciseHeader exercise={exercise} passedAlready={passedAlready} />
      <p className="mb-3 text-sm text-lab-phosphorDim">{exercise.prompt}</p>

      {!transcript ? (
        <button
          type="button"
          onClick={handleRunDebugger}
          disabled={busy}
          className="rounded border border-lab-phosphorDim/60 px-3 py-1.5 text-xs text-lab-phosphor hover:bg-lab-phosphorDim/20 disabled:opacity-50"
        >
          {busy ? 'Attaching debugger…' : 'Run Debugger Session'}
        </button>
      ) : (
        <>
          <pre className="mb-3 max-h-64 overflow-auto rounded border border-lab-wire bg-black/50 p-3 text-xs text-lab-phosphor">
            {transcript.stdout || transcript.compileLog}
          </pre>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="What did the debugger reveal?"
            className="w-full rounded border border-lab-wire bg-black/40 p-2 text-sm text-lab-phosphor outline-none focus:border-lab-phosphorDim"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || answer.trim() === ''}
              className="rounded border border-lab-amber/60 px-3 py-1.5 text-xs text-lab-amber hover:bg-lab-amber/10 disabled:opacity-50"
            >
              Submit
            </button>
            {result && (
              <span className={result.testResults?.[0]?.passed ? 'text-lab-phosphor' : 'text-lab-alert'}>
                {result.testResults?.[0]?.passed ? 'Correct diagnosis.' : 'Not quite - run it again and look closer.'}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
