import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { TABLES_QUIZ_MISSES_KEY } from "../../lib/constants";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

const TABLE_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);
const MULTIPLIERS = Array.from({ length: 10 }, (_, i) => i + 1);

// A wrong answer earns extra weight in the random draw so that fact comes
// back around sooner than the ones already known -- getting it right pays
// that weight back down rather than clearing it outright, so one lucky
// guess doesn't erase a genuine weak spot.
const DEFAULT_RANGE: Range = { min: 2, max: 15 };

const MISS_WEIGHT = 3;
const WEAK_SPOT_THRESHOLD = 2;

interface Fact {
  n: number;
  m: number;
}

interface Range {
  min: number;
  max: number;
}

interface Wrong {
  fact: Fact;
  picked: number;
}

interface Question {
  fact: Fact;
  choices: number[];
}

function factKey(f: Fact): string {
  return `${f.n}-${f.m}`;
}

function loadMisses(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(TABLES_QUIZ_MISSES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMisses(misses: Record<string, number>) {
  try {
    localStorage.setItem(TABLES_QUIZ_MISSES_KEY, JSON.stringify(misses));
  } catch {
    // localStorage unavailable (private browsing, etc.) -- weak-spot
    // tracking just won't persist across reloads.
  }
}

function pickFact(misses: Record<string, number>, range: Range, exclude?: string): Fact {
  const pool = TABLE_NUMBERS.filter((n) => n >= range.min && n <= range.max).flatMap((n) => MULTIPLIERS.map((m) => ({ n, m })));
  const candidates = pool.length > 1 ? pool.filter((f) => factKey(f) !== exclude) : pool;
  const weighted = candidates.map((f) => ({ fact: f, weight: 1 + (misses[factKey(f)] ?? 0) * MISS_WEIGHT }));
  const totalWeight = weighted.reduce((sum, c) => sum + c.weight, 0);
  let r = Math.random() * totalWeight;
  for (const c of weighted) {
    r -= c.weight;
    if (r <= 0) return c.fact;
  }
  return weighted[weighted.length - 1].fact;
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Two wrong options near the real answer -- off by one multiplicand, off by
// a small amount -- read as "an easy mistake to actually make" rather than
// an obviously-wrong number nobody would tap.
function generateChoices(fact: Fact): number[] {
  const correct = fact.n * fact.m;
  const offsets = [fact.n, fact.m, 1, 2, 3];
  const candidates = new Set<number>();
  offsets.forEach((d) => {
    if (correct - d > 0) candidates.add(correct - d);
    candidates.add(correct + d);
  });
  candidates.delete(correct);

  const distractors = shuffled([...candidates]).slice(0, 2);
  while (distractors.length < 2) {
    const guess = correct + (Math.floor(Math.random() * 10) + 1) * (Math.random() < 0.5 ? -1 : 1);
    if (guess > 0 && guess !== correct && !distractors.includes(guess)) distractors.push(guess);
  }

  return shuffled([correct, ...distractors]);
}

function makeQuestion(misses: Record<string, number>, range: Range, exclude?: string): Question {
  const fact = pickFact(misses, range, exclude);
  return { fact, choices: generateChoices(fact) };
}

export default function QuizPanel() {
  const [misses, setMisses] = useState<Record<string, number>>(loadMisses);
  const [range, setRange] = useState<Range>(DEFAULT_RANGE);
  const rangeRef = useRef(range);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(loadMisses(), DEFAULT_RANGE));
  const [wrongs, setWrongs] = useState<Wrong[]>([]);
  const [feedback, setFeedback] = useState<{ picked: number; correct: boolean } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const weakSpots = useMemo(
    () =>
      Object.entries(misses)
        .filter(([, count]) => count >= WEAK_SPOT_THRESHOLD)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key]) => key.replace("-", " × ")),
    [misses],
  );

  function advance() {
    setQuestion((prev) => makeQuestion(misses, rangeRef.current, factKey(prev.fact)));
    setFeedback(null);
  }

  function handleChoice(picked: number) {
    if (feedback) return;

    const answer = question.fact.n * question.fact.m;
    const isCorrect = picked === answer;
    const key = factKey(question.fact);
    const nextMisses = { ...misses };
    if (isCorrect) {
      const reduced = Math.max(0, (nextMisses[key] ?? 0) - 1);
      if (reduced === 0) delete nextMisses[key];
      else nextMisses[key] = reduced;
    } else {
      nextMisses[key] = (nextMisses[key] ?? 0) + 1;
      setWrongs((w) => [...w, { fact: question.fact, picked }]);
    }
    setMisses(nextMisses);
    saveMisses(nextMisses);
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setFeedback({ picked, correct: isCorrect });

    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(advance, isCorrect ? 700 : 1600);
  }

  function resetScore() {
    setScore({ correct: 0, total: 0 });
    setWrongs([]);
  }

  // Changing the range starts a fresh round: the score and the wrong-answer
  // list belong to the range they were earned in.
  function changeRange(next: Range) {
    clearTimeout(advanceTimer.current);
    rangeRef.current = next;
    setRange(next);
    setQuestion(makeQuestion(misses, next));
    setFeedback(null);
    resetScore();
  }

  function resetWeakSpots() {
    setMisses({});
    saveMisses({});
  }

  const answer = question.fact.n * question.fact.m;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Tables
        <select
          aria-label="First table"
          className="rounded-md border bg-background px-2 py-1 text-foreground"
          value={range.min}
          onChange={(e) => {
            const min = Number(e.target.value);
            changeRange({ min, max: Math.max(min, range.max) });
          }}
        >
          {TABLE_NUMBERS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        to
        <select
          aria-label="Last table"
          className="rounded-md border bg-background px-2 py-1 text-foreground"
          value={range.max}
          onChange={(e) => {
            const max = Number(e.target.value);
            changeRange({ min: Math.min(max, range.min), max });
          }}
        >
          {TABLE_NUMBERS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <Card size="sm" className="w-full gap-3 sm:max-w-sm">
        <CardContent className="flex flex-col items-center justify-center gap-6 py-10">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {score.correct} / {score.total}
            </Badge>
            {score.total > 0 && (
              <Button variant="ghost" size="xs" onClick={resetScore} title="Restart score">
                <RotateCcw />
              </Button>
            )}
          </div>

          <div className="text-3xl font-medium tabular-nums">
            {question.fact.n} × {question.fact.m} = ?
          </div>

          <div className="grid w-full grid-cols-3 gap-3">
            {question.choices.map((c) => {
              const isCorrectChoice = c === answer;
              const isPicked = feedback?.picked === c;
              const variant = feedback && isPicked && !isCorrectChoice ? "destructive" : "outline";
              // The relevant button (the right answer, or the wrong one that
              // got picked) stays at full strength once answered -- only the
              // untouched third option fades, via the button's own
              // disabled:opacity-50, so the colored feedback doesn't wash out.
              const highlighted = feedback && (isCorrectChoice || isPicked);
              const correctClass = feedback && isCorrectChoice ? "border-green-500/50 bg-green-500/15 text-green-700 dark:border-green-500/40 dark:text-green-400" : "";
              return (
                <Button
                  key={c}
                  type="button"
                  variant={variant}
                  className={`h-16 text-xl tabular-nums ${correctClass} ${highlighted ? "disabled:opacity-100" : ""}`}
                  disabled={feedback !== null}
                  onClick={() => handleChoice(c)}
                >
                  {c}
                </Button>
              );
            })}
          </div>

          {feedback && (
            <div
              className={
                feedback.correct ? "text-sm font-medium text-green-600 dark:text-green-400" : "text-sm font-medium text-destructive"
              }
            >
              {feedback.correct ? "Correct!" : `Not quite — ${question.fact.n} × ${question.fact.m} = ${answer}`}
            </div>
          )}
        </CardContent>
      </Card>

      {wrongs.length > 0 && (
        <div className="w-full sm:max-w-sm">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Missed ({wrongs.length})</div>
          <ul className="flex flex-col gap-1 text-sm tabular-nums">
            {wrongs.map((w, i) => (
              <li key={i} className="flex items-center justify-between rounded-md bg-destructive/10 px-3 py-1.5">
                <span>
                  {w.fact.n} × {w.fact.m} = {w.fact.n * w.fact.m}
                </span>
                <span className="text-xs text-muted-foreground">you said {w.picked}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {weakSpots.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Weak spots:
          {weakSpots.map((f) => (
            <Badge key={f} variant="outline">
              {f}
            </Badge>
          ))}
          <Button variant="ghost" size="xs" onClick={resetWeakSpots}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
