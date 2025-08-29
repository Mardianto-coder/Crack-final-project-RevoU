import "./index.css";
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, GraduationCap, Plus, LogOut, Shield, User, Search, Layers, Clock, Trophy, CheckCircle2, XCircle, Edit3, Trash2, BarChart3 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// ------------------------------------------------------------
// Mini LMS — Single‑File React App
// Features:
// - Mock auth (student/instructor/admin)
// - Course catalog + enrollment
// - Lessons with rich text & resources
// - Quizzes (MCQ) with scoring & progress tracking
// - Instructor/Admin: create/edit/delete courses, lessons, quizzes
// - LocalStorage persistence
// - Search, filtering, basic analytics
// - Polished UI with Tailwind, shadcn/ui, framer-motion
// ------------------------------------------------------------

// Types
/** @typedef {{ id: string, title: string, description: string, category: string, level: "Beginner"|"Intermediate"|"Advanced", durationMins: number, lessons: Lesson[], quiz?: Quiz }} Course */
/** @typedef {{ id: string, title: string, content: string, resources?: {label:string, url:string}[] }} Lesson */
/** @typedef {{ id: string, title: string, questions: Question[] }} Quiz */
/** @typedef {{ id: string, prompt: string, choices: string[], answerIndex: number }} Question */
/** @typedef {{ name: string, role: "student"|"instructor"|"admin", enrolled: string[], progress: Record<string, { completedLessonIds: string[], quizScore?: number }> }} UserProfile */

const seedCourses: Course[] = [
  {
    id: "c-js-101",
    title: "JavaScript Fundamentals",
    description: "Start coding with JS: variables, functions, arrays, and DOM.",
    category: "Programming",
    level: "Beginner",
    durationMins: 180,
    lessons: [
      {
        id: "l-js-1",
        title: "Intro & Setup",
        content:
          "JavaScript runs in the browser and on servers (Node.js). Install a code editor (VS Code) and open DevTools. Try `console.log('Hello')`.",
        resources: [
          { label: "MDN – JS Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
        ],
      },
      {
        id: "l-js-2",
        title: "Variables & Types",
        content:
          "Use `let`/`const` for block-scoped variables. Primitives: string, number, boolean, null, undefined, symbol, bigint.",
      },
      {
        id: "l-js-3",
        title: "Functions & Arrays",
        content:
          "Functions encapsulate logic. Arrays store ordered data. Practice mapping and filtering arrays.",
      },
    ],
    quiz: {
      id: "q-js-1",
      title: "JS Basics Quiz",
      questions: [
        {
          id: "q1",
          prompt: "Which keyword creates a block-scoped variable?",
          choices: ["var", "let", "function", "scope"],
          answerIndex: 1,
        },
        {
          id: "q2",
          prompt: "What method creates a new array with items that pass a test?",
          choices: ["forEach", "map", "reduce", "filter"],
          answerIndex: 3,
        },
      ],
    },
  },
  {
    id: "c-ui-201",
    title: "UI/UX Design Essentials",
    description: "Design interfaces that feel good: hierarchy, contrast, spacing.",
    category: "Design",
    level: "Intermediate",
    durationMins: 120,
    lessons: [
      {
        id: "l-ui-1",
        title: "Design Principles",
        content:
          "Hierarchy, contrast, alignment, repetition. Keep spacing generous; balance typography with scale & weight.",
      },
      {
        id: "l-ui-2",
        title: "Wireframing",
        content:
          "Use low-fidelity wireframes to validate ideas fast before hi-fi mockups.",
      },
    ],
    quiz: {
      id: "q-ui-1",
      title: "UI Essentials Quiz",
      questions: [
        {
          id: "u1",
          prompt: "Which is NOT a core design principle?",
          choices: ["Hierarchy", "Repetition", "Confusion", "Contrast"],
          answerIndex: 2,
        },
      ],
    },
  },
];

const LS_KEYS = {
  user: "mini-lms:user",
  courses: "mini-lms:courses",
};

function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState] as const;
}

function minutesToNice(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${r}m` : `${r}m`;
}

function LevelBadge({ level }: { level: Course["level"] }) {
  const intent = level === "Beginner" ? "bg-emerald-100 text-emerald-700" : level === "Intermediate" ? "bg-amber-100 text-amber-700" : "bg-fuchsia-100 text-fuchsia-700";
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${intent}`}>{level}</span>;
}

export default function LMSApp() {
  const [courses, setCourses] = useLocalStorage<Course[]>(LS_KEYS.courses, seedCourses);
  const [user, setUser] = useLocalStorage<UserProfile | null>(LS_KEYS.user, null);
  const [query, setQuery] = useState("");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [quizDialog, setQuizDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Course | null>(null);

  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId) || null, [courses, activeCourseId]);
  const activeLesson = useMemo(() => activeCourse?.lessons.find(l => l.id === activeLessonId) || null, [activeCourse, activeLessonId]);

  // Derived analytics
  const analytics = useMemo(() => {
    const enrolled = user?.enrolled || [];
    const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);
    const completed = Object.values(user?.progress || {}).reduce((acc, p) => acc + (p.completedLessonIds?.length || 0), 0);
    const avgScore = (() => {
      const scores = Object.values(user?.progress || {}).map(p => p.quizScore).filter(Boolean) as number[];
      if (!scores.length) return null;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    })();
    return { enrolledCount: enrolled.length, totalLessons, completed, avgScore };
  }, [user, courses]);

  function login(name: string, role: UserProfile["role"]) {
    const profile: UserProfile = { name, role, enrolled: [], progress: {} };
    setUser(profile);
  }
  function logout() {
    setUser(null);
    setActiveCourseId(null);
    setActiveLessonId(null);
  }

  function enroll(courseId: string) {
    if (!user) return;
    if (user.enrolled.includes(courseId)) return;
    setUser({ ...user, enrolled: [...user.enrolled, courseId] });
  }

  function markLessonDone(courseId: string, lessonId: string) {
    if (!user) return;
    const current = user.progress[courseId] || { completedLessonIds: [] as string[] };
    if (current.completedLessonIds.includes(lessonId)) return;
    const updated = { ...user, progress: { ...user.progress, [courseId]: { ...current, completedLessonIds: [...current.completedLessonIds, lessonId] } } };
    setUser(updated);
  }

  function submitQuiz(courseId: string, score: number) {
    if (!user) return;
    const current = user.progress[courseId] || { completedLessonIds: [] as string[] };
    const updated = { ...user, progress: { ...user.progress, [courseId]: { ...current, quizScore: score } } };
    setUser(updated);
  }

  // CRUD for courses (instructor/admin)
  function upsertCourse(next: Course) {
    setCourses(prev => {
      const exists = prev.some(c => c.id === next.id);
      if (exists) return prev.map(c => (c.id === next.id ? next : c));
      return [next, ...prev];
    });
  }
  function deleteCourse(courseId: string) {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      setActiveLessonId(null);
    }
  }

  // Filtering
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return courses.filter(c => [c.title, c.description, c.category, c.level].join(" ").toLowerCase().includes(q));
  }, [courses, query]);

  // Create/edit form state
  const [form, setForm] = useState<Partial<Course>>({ level: "Beginner", lessons: [] });
  function resetForm() {
    setForm({ level: "Beginner", lessons: [] });
    setEditTarget(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-800">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          <h1 className="font-semibold text-lg">Mini LMS</h1>
          <Badge className="ml-2">Demo</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Input placeholder="Search courses..." value={query} onChange={e => setQuery(e.target.value)} className="w-56" />
            {user ? (
              <>
                <Badge variant="secondary" className="hidden sm:inline-flex items-center gap-1"><User className="w-3 h-3" />{user.name}</Badge>
                <Badge className="hidden sm:inline-flex capitalize">{user.role}</Badge>
                <Button variant="ghost" onClick={logout} className="gap-2"><LogOut className="w-4 h-4" /> Logout</Button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {!user ? (
          <Auth onLogin={login} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Catalog
                courses={filtered}
                user={user}
                onOpen={(id) => { setActiveCourseId(id); setActiveLessonId(null); }}
                onEnroll={enroll}
              />
              {activeCourse && (
                <CourseDetail
                  key={activeCourse.id}
                  course={activeCourse}
                  user={user}
                  onSelectLesson={setActiveLessonId}
                  activeLessonId={activeLessonId}
                  onCompleteLesson={(lessonId) => markLessonDone(activeCourse.id, lessonId)}
                  onOpenQuiz={() => setQuizDialog(true)}
                />
              )}
            </div>
            <div className="space-y-4">
              <Dashboard analytics={analytics} user={user} />
              {(user.role === "instructor" || user.role === "admin") && (
                <InstructorPanel
                  courses={courses}
                  onCreate={() => { setCreateDialog(true); resetForm(); }}
                  onEdit={(c) => { setEditTarget(c); setForm(c); setCreateDialog(true); }}
                  onDelete={deleteCourse}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={quizDialog} onOpenChange={setQuizDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5" />{activeCourse?.quiz?.title || "Quiz"}</DialogTitle>
            <DialogDescription>Answer all questions and submit to see your score.</DialogDescription>
          </DialogHeader>
          {activeCourse?.quiz ? (
            <QuizView
              quiz={activeCourse.quiz}
              onSubmit={(score) => { submitQuiz(activeCourse.id, score); setQuizDialog(false); }}
            />
          ) : (
            <p>No quiz available for this course.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createDialog} onOpenChange={(v) => { setCreateDialog(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Layers className="w-5 h-5" />{editTarget ? "Edit Course" : "Create Course"}</DialogTitle>
            <DialogDescription>Build a course with lessons and an optional quiz.</DialogDescription>
          </DialogHeader>
          <CourseForm
            form={form}
            setForm={setForm}
            onCancel={() => { setCreateDialog(false); resetForm(); }}
            onSave={(course) => { upsertCourse(course); setCreateDialog(false); resetForm(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Auth({ onLogin }: { onLogin: (name: string, role: UserProfile["role"]) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserProfile["role"]>("student");
  const canGo = name.trim().length >= 2;
  return (
    <div className="h-[70vh] grid place-items-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl"><GraduationCap className="w-6 h-6" /> Welcome to Mini LMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Your name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {["student", "instructor", "admin"].map(r => (
                <Button key={r} variant={role === r ? "default" : "secondary"} className="capitalize" onClick={() => setRole(r as any)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <Button disabled={!canGo} className="w-full" onClick={() => onLogin(name.trim(), role)}>Enter</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Catalog({ courses, user, onOpen, onEnroll }: { courses: Course[]; user: UserProfile; onOpen: (id: string) => void; onEnroll: (id: string) => void; }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Search className="w-5 h-5" /> Course Catalog</h2>
        <span className="text-sm text-slate-500">{courses.length} result(s)</span>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {courses.map(c => (
          <motion.div key={c.id} initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.25}}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <LevelBadge level={c.level} />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Badge variant="outline">{c.category}</Badge>
                  <Clock className="w-3 h-3" /> {minutesToNice(c.durationMins)}
                  <Layers className="w-3 h-3 ml-2" /> {c.lessons.length} lessons
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => onOpen(c.id)}>Open</Button>
                  {user.enrolled.includes(c.id) ? (
                    <Badge variant="secondary">Enrolled</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onEnroll(c.id)}>Enroll</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CourseDetail({ course, user, onSelectLesson, activeLessonId, onCompleteLesson, onOpenQuiz }: { course: Course; user: UserProfile; activeLessonId: string | null; onSelectLesson: (id: string) => void; onCompleteLesson: (lessonId: string) => void; onOpenQuiz: () => void; }) {
  const progress = user.progress[course.id]?.completedLessonIds || [];
  const pct = Math.round((progress.length / course.lessons.length) * 100) || 0;
  return (
    <section className="mt-2">
      <Card className="shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2"><BookOpen className="w-5 h-5" /> {course.title}</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{course.description}</p>
            </div>
            <div className="text-right min-w-[160px]">
              <div className="text-xs text-slate-500 mb-1">Progress {pct}%</div>
              <Progress value={pct} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              {course.lessons.map(lsn => (
                <button key={lsn.id} onClick={() => onSelectLesson(lsn.id)} className={`w-full text-left px-3 py-2 rounded-xl border hover:bg-slate-50 transition flex items-start gap-2 ${activeLessonId === lsn.id ? 'border-slate-900' : ''}`}>
                  <div className="mt-1">
                    {progress.includes(lsn.id) ? <CheckCircle2 className="w-4 h-4" /> : <CircleDot />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{lsn.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{lsn.content}</div>
                  </div>
                </button>
              ))}
              {course.quiz && (
                <Button className="w-full mt-2" variant="secondary" onClick={onOpenQuiz}><Trophy className="w-4 h-4 mr-2" /> Take Quiz</Button>
              )}
            </div>
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {activeLessonId ? (
                  <motion.div key={activeLessonId} initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} transition={{duration:0.2}} className="space-y-3">
                    <h3 className="text-lg font-semibold">{course.lessons.find(l => l.id === activeLessonId)?.title}</h3>
                    <p className="text-sm leading-6">{course.lessons.find(l => l.id === activeLessonId)?.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {course.lessons.find(l => l.id === activeLessonId)?.resources?.map(r => (
                        <a key={r.url} href={r.url} target="_blank" className="text-xs underline" rel="noreferrer">{r.label}</a>
                      ))}
                    </div>
                    {!progress.includes(activeLessonId) && (
                      <Button onClick={() => onCompleteLesson(activeLessonId)} className="mt-2">Mark as Complete</Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-sm text-slate-600">Select a lesson to start learning.</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CircleDot() {
  return <span className="inline-block w-4 h-4 rounded-full border" />
}

function Dashboard({ analytics, user }: { analytics: { enrolledCount: number, totalLessons: number, completed: number, avgScore: number | null }, user: UserProfile }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Dashboard</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Enrolled" value={analytics.enrolledCount} />
        <Stat label="Lessons" value={analytics.totalLessons} />
        <Stat label="Completed" value={analytics.completed} />
        <Stat label="Avg Quiz" value={analytics.avgScore !== null ? `${analytics.avgScore}%` : "—"} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function InstructorPanel({ courses, onCreate, onEdit, onDelete }: { courses: Course[], onCreate: () => void, onEdit: (c: Course) => void, onDelete: (id: string) => void }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5" /> Instructor / Admin</h2>
        <Button onClick={onCreate} className="gap-2"><Plus className="w-4 h-4" /> New Course</Button>
      </div>
      <div className="space-y-2">
        {courses.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl">
            <div>
              <div className="font-medium">{c.title}</div>
              <div className="text-xs text-slate-500">{c.category} • {c.level} • {c.lessons.length} lessons</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => onEdit(c)} className="gap-1"><Edit3 className="w-4 h-4" /> Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(c.id)} className="gap-1"><Trash2 className="w-4 h-4" /> Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuizView({ quiz, onSubmit }: { quiz: Quiz, onSubmit: (score: number) => void }) {
  const [answers, setAnswers] = useState<number[]>(Array(quiz.questions.length).fill(-1));
  const [done, setDone] = useState(false);
  const score = useMemo(() => {
    const total = quiz.questions.length;
    const correct = quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0), 0);
    return Math.round((correct / total) * 100);
  }, [answers, quiz.questions]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {quiz.questions.map((q, idx) => (
          <Card key={q.id} className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="font-medium">{idx + 1}. {q.prompt}</div>
              <div className="grid gap-2">
                {q.choices.map((choice, cIdx) => (
                  <label key={cIdx} className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer ${answers[idx] === cIdx ? 'border-slate-900' : ''}`}>
                    <input type="radio" className="accent-black" name={`q-${q.id}`} checked={answers[idx] === cIdx} onChange={() => setAnswers(prev => { const copy = [...prev]; copy[idx] = cIdx; return copy; })} />
                    <span className="text-sm">{choice}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {done ? (
            score >= 60 ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Passed • {score}%</span> : <span className="inline-flex items-center gap-1 text-rose-700"><XCircle className="w-4 h-4" /> Try again • {score}%</span>
          ) : <span className="text-slate-500">Answer all questions then submit.</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setAnswers(Array(quiz.questions.length).fill(-1))}>Reset</Button>
          <Button onClick={() => { setDone(true); onSubmit(score); }}>Submit</Button>
        </div>
      </div>
    </div>
  );
}

function CourseForm({ form, setForm, onCancel, onSave }: { form: Partial<Course>, setForm: (f: Partial<Course>) => void, onCancel: () => void, onSave: (c: Course) => void }) {
  const [tab, setTab] = useState("meta");

  function ensureCourse(): Course | null {
    if (!form.id || !form.title || !form.description || !form.category || !form.level || !form.durationMins || !form.lessons?.length) return null;
    return form as Course;
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>
        <TabsContent value="meta" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <FormField label="Course ID" value={form.id || ""} onChange={v => setForm({ ...form, id: v })} placeholder="c-my-course" />
            <FormField label="Title" value={form.title || ""} onChange={v => setForm({ ...form, title: v })} placeholder="My Great Course" />
            <FormField label="Category" value={form.category || ""} onChange={v => setForm({ ...form, category: v })} placeholder="e.g., Programming" />
            <FormField label="Level" value={String(form.level || "Beginner")} onChange={v => setForm({ ...form, level: v as any })} placeholder="Beginner | Intermediate | Advanced" />
            <FormField label="Duration (mins)" type="number" value={String(form.durationMins || "")} onChange={v => setForm({ ...form, durationMins: Number(v) })} placeholder="120" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="What will learners gain?" />
          </div>
        </TabsContent>
        <TabsContent value="lessons" className="space-y-3">
          <LessonEditor lessons={form.lessons as Lesson[] || []} onChange={(lessons) => setForm({ ...form, lessons })} />
        </TabsContent>
        <TabsContent value="quiz" className="space-y-3">
          <QuizEditor quiz={form.quiz || { id: "q-1", title: "Course Quiz", questions: [] }} onChange={(quiz) => setForm({ ...form, quiz })} />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => { const c = ensureCourse(); if (c) onSave(c); }} disabled={!ensureCourse()}>Save Course</Button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function LessonEditor({ lessons, onChange }: { lessons: Lesson[], onChange: (l: Lesson[]) => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [resources, setResources] = useState<{label:string, url:string}[]>([]);
  function addLesson() {
    const id = `l-${Math.random().toString(36).slice(2,8)}`;
    onChange([{ id, title: title || "Untitled Lesson", content: content || "", resources }, ...lessons]);
    setTitle(""); setContent(""); setResources([]);
  }
  function removeLesson(id: string) {
    onChange(lessons.filter(l => l.id !== id));
  }
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="space-y-3">
        <FormField label="Lesson title" value={title} onChange={setTitle} placeholder="Lesson title" />
        <div className="grid gap-2">
          <label className="text-sm font-medium">Content</label>
          <Textarea rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Lesson content (markdown/notes)" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Resources</label>
          <ResourceEditor resources={resources} onChange={setResources} />
        </div>
        <Button onClick={addLesson} className="gap-2"><Plus className="w-4 h-4" /> Add Lesson</Button>
      </div>
      <div className="space-y-2">
        {lessons.length ? lessons.map(l => (
          <div key={l.id} className="p-3 border rounded-xl">
            <div className="font-medium">{l.title}</div>
            <div className="text-xs text-slate-500 line-clamp-2">{l.content}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {l.resources?.map(r => <Badge key={r.url} variant="outline">{r.label}</Badge>)}
            </div>
            <div className="mt-2"><Button size="sm" variant="destructive" onClick={() => removeLesson(l.id)}>Remove</Button></div>
          </div>
        )) : <div className="text-sm text-slate-600">No lessons yet. Add your first lesson.</div>}
      </div>
    </div>
  );
}

function ResourceEditor({ resources, onChange }: { resources: {label:string, url:string}[], onChange: (r: {label:string, url:string}[]) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  function add() {
    if (!label || !url) return; onChange([{label, url}, ...resources]); setLabel(""); setUrl("");
  }
  function remove(idx: number) { onChange(resources.filter((_, i) => i !== idx)); }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        <Input className="col-span-2" placeholder="Label" value={label} onChange={e => setLabel(e.target.value)} />
        <Input className="col-span-3" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <Button variant="secondary" onClick={add} size="sm">Add Resource</Button>
      <div className="flex flex-wrap gap-2">
        {resources.map((r, i) => (
          <Badge key={i} variant="secondary" className="gap-2">{r.label}<button onClick={() => remove(i)} className="ml-1">×</button></Badge>
        ))}
      </div>
    </div>
  );
}

function QuizEditor({ quiz, onChange }: { quiz: Quiz, onChange: (q: Quiz) => void }) {
  const [title, setTitle] = useState(quiz.title);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [answerIndex, setAnswerIndex] = useState(0);

  function addQuestion() {
    const q: Question = { id: `q-${Math.random().toString(36).slice(2,8)}` , prompt, choices, answerIndex };
    onChange({ ...quiz, title, questions: [q, ...quiz.questions] });
    setPrompt(""); setChoices(["", "", "", ""]); setAnswerIndex(0);
  }
  function removeQuestion(id: string) {
    onChange({ ...quiz, questions: quiz.questions.filter(q => q.id !== id) });
  }

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="space-y-3">
        <FormField label="Quiz Title" value={title} onChange={(v) => { setTitle(v); onChange({ ...quiz, title: v }); }} />
        <div className="grid gap-2">
          <label className="text-sm font-medium">Question</label>
          <Textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Type the question" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Choices</label>
          {choices.map((c, i) => (
            <Input key={i} value={c} onChange={e => setChoices(prev => prev.map((v, idx) => idx === i ? e.target.value : v))} placeholder={`Choice ${i+1}`} />
          ))}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Correct Answer Index (0-3)</label>
          <Input type="number" value={String(answerIndex)} onChange={e => setAnswerIndex(Math.max(0, Math.min(3, Number(e.target.value))))} />
        </div>
        <Button onClick={addQuestion} className="gap-2"><Plus className="w-4 h-4" /> Add Question</Button>
      </div>
      <div className="space-y-2">
        {quiz.questions.length ? quiz.questions.map(q => (
          <div key={q.id} className="p-3 border rounded-xl">
            <div className="font-medium">{q.prompt}</div>
            <ol className="list-decimal list-inside text-sm text-slate-600">
              {q.choices.map((c, i) => <li key={i} className={i === q.answerIndex ? "font-semibold" : ""}>{c || <em>(empty)</em>}</li>)}
            </ol>
            <div className="text-xs text-slate-500">Answer: {q.answerIndex + 1}</div>
            <div className="mt-2"><Button size="sm" variant="destructive" onClick={() => removeQuestion(q.id)}>Remove</Button></div>
          </div>
        )) : <div className="text-sm text-slate-600">No questions yet. Add your first question.</div>}
      </div>
    </div>
  );
}
