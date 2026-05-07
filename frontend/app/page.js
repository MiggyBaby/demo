"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = "http://localhost:3001/tasks";

const emptyForm = {
  title: "",
  description: "",
  status: "Pending",
  priority: "Medium",
  dueDate: "",
};

const filters = [
  "All",
  "Pending",
  "In Progress",
  "Completed",
  "High Priority",
  "Due Soon",
  "Overdue",
];

const priorityOrder = {
  High: 1,
  Medium: 2,
  Low: 3,
};

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const getDueState = useCallback((dueDate) => {
    if (!dueDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${dueDate}T00:00:00`);
    const difference = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (difference < 0) {
      return {
        label: `Overdue by ${Math.abs(difference)} day${Math.abs(difference) === 1 ? "" : "s"}`,
        tone: "danger",
        type: "Overdue",
      };
    }

    if (difference === 0) {
      return {
        label: "Due today",
        tone: "warning",
        type: "Due Soon",
      };
    }

    if (difference === 1) {
      return {
        label: "Due tomorrow",
        tone: "warning",
        type: "Due Soon",
      };
    }

    if (difference <= 3) {
      return {
        label: `Due in ${difference} days`,
        tone: "warning",
        type: "Due Soon",
      };
    }

    return {
      label: dueDate,
      tone: "neutral",
      type: "Scheduled",
    };
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoadError("");
      const res = await fetch(API_URL);

      if (!res.ok) {
        throw new Error("Could not load tasks");
      }

      const data = await res.json();
      setTasks([...data].reverse());
    } catch (error) {
      setLoadError("Could not connect to the task server. Make sure the backend is running on port 3001.");
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTasks = window.setTimeout(() => {
      void fetchTasks();
    }, 0);

    return () => window.clearTimeout(loadTasks);
  }, [fetchTasks]);

  useEffect(() => {
    const clock = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 60);

    return () => window.clearInterval(clock);
  }, []);

  const clearForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const createTask = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please complete the title and description");
      return;
    }

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      toast.success("Task created successfully");
      await fetchTasks();
      clearForm();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const confirmDeleteTask = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await fetch(`${API_URL}/${deleteTarget.id}`, {
        method: "DELETE",
      });

      toast.success("Task deleted");
      setDeleteTarget(null);
      await fetchTasks();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const editTask = (task) => {
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority || "Medium",
      dueDate: task.dueDate || "",
    });

    setEditingId(task.id);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const updateTask = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Please complete the title and description");
      return;
    }

    try {
      await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      toast.success("Task updated successfully");
      await fetchTasks();
      clearForm();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const filteredTasks = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm);

        if (!matchesSearch) {
          return false;
        }

        if (activeFilter === "All") {
          return true;
        }

        if (activeFilter === "High Priority") {
          return task.priority === "High";
        }

        if (activeFilter === "Due Soon" || activeFilter === "Overdue") {
          return getDueState(task.dueDate)?.type === activeFilter;
        }

        return task.status === activeFilter;
      })
      .sort((a, b) => {
        return priorityOrder[a.priority || "Medium"] - priorityOrder[b.priority || "Medium"];
      });
  }, [activeFilter, getDueState, search, tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const pendingTasks = tasks.filter((task) => task.status === "Pending").length;
  const progressTasks = tasks.filter((task) => task.status === "In Progress").length;
  const highPriorityTasks = tasks.filter((task) => task.priority === "High").length;
  const dueSoonTasks = tasks.filter((task) => getDueState(task.dueDate)?.type === "Due Soon").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const canSubmit = form.title.trim() && form.description.trim();
  const dateLabel = useMemo(
    () =>
      currentTime.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [currentTime]
  );
  const timeLabel = useMemo(
    () =>
      currentTime.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }),
    [currentTime]
  );

  const getStatusColor = (status) => {
    if (status === "Completed") {
      return "bg-emerald-500/15 text-emerald-200 border border-emerald-400/25";
    }

    if (status === "In Progress") {
      return "bg-sky-500/15 text-sky-200 border border-sky-400/25";
    }

    return "bg-amber-500/15 text-amber-200 border border-amber-400/25";
  };

  const getPriorityColor = (priority) => {
    if (priority === "High") {
      return "bg-rose-500/15 text-rose-200 border border-rose-400/25";
    }

    if (priority === "Medium") {
      return "bg-orange-500/15 text-orange-200 border border-orange-400/25";
    }

    return "bg-cyan-500/15 text-cyan-200 border border-cyan-400/25";
  };

  const getDueColor = (tone) => {
    if (tone === "danger") {
      return "bg-rose-500/15 text-rose-200 border border-rose-400/25";
    }

    if (tone === "warning") {
      return "bg-amber-500/15 text-amber-200 border border-amber-400/25";
    }

    return "bg-white/10 text-slate-300 border border-white/10";
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#08111f_0%,#0c1727_38%,#132117_100%)] text-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#08111f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-xl font-black text-slate-950 shadow-lg shadow-emerald-950/30">
              T
            </div>
            <div>
              <h1 className="text-xl font-black tracking-normal">TaskFlow</h1>
              <p className="text-xs text-slate-400">Productivity Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-right md:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Today</p>
              <p className="text-sm font-bold text-white">{timeLabel}</p>
            </div>
            <button
              onClick={() => {
                clearForm();
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }}
              className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
            >
              New Task
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-200">
              Work overview
            </p>
            <h2 className="max-w-3xl text-4xl font-black leading-tight tracking-normal md:text-5xl">
              Your personal task command center
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
              Keep the current date, priorities, due dates, and progress visible while you work.
            </p>
          </div>

          <section className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-emerald-200/20 bg-emerald-300/10 p-5 shadow-xl shadow-black/10">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-100">Local time</p>
              <p className="mt-3 text-4xl font-black leading-none tracking-normal text-white">{timeLabel}</p>
              <p className="mt-3 text-sm leading-relaxed text-emerald-50/80">{dateLabel}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
              <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                <span>Completion</span>
                <span className="font-bold text-white">{completionRate}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-amber-300/10 p-3">
                  <p className="text-amber-100/80">High priority</p>
                  <p className="text-2xl font-black">{highPriorityTasks}</p>
                </div>
                <div className="rounded-xl bg-sky-300/10 p-3">
                  <p className="text-sky-100/80">Due soon</p>
                  <p className="text-2xl font-black">{dueSoonTasks}</p>
                </div>
              </div>
            </div>
          </section>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total Tasks" value={totalTasks} />
          <SummaryCard label="Completed" value={completedTasks} tone="emerald" />
          <SummaryCard label="Pending" value={pendingTasks} tone="amber" />
          <SummaryCard label="In Progress" value={progressTasks} tone="sky" />
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 pr-24 text-base outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-300/15 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/25"
              >
                Clear
              </button>
            )}
          </div>

          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
            {filteredTasks.length} shown
          </p>
        </section>

        <section className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                activeFilter === filter
                  ? "border-emerald-300 bg-emerald-300 text-slate-950"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {filter}
            </button>
          ))}
        </section>

        {loadError && (
          <section className="mb-8 rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5">
            <h3 className="font-bold text-rose-100">Tasks could not load</h3>
            <p className="mt-1 text-sm text-rose-100/80">{loadError}</p>
            <button
              onClick={() => {
                setLoading(true);
                void fetchTasks();
              }}
              className="mt-4 rounded-xl bg-rose-200 px-4 py-2 text-sm font-bold text-rose-950"
            >
              Try Again
            </button>
          </section>
        )}

        {loading ? (
          <section className="mb-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </section>
        ) : filteredTasks.length === 0 ? (
          <section className="mb-12 rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-2xl font-black text-slate-950">
              +
            </div>
            <h3 className="text-2xl font-black">No tasks found</h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-400">
              Create a task or adjust your search and filters to see more work here.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveFilter("All");
              }}
              className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Reset View
            </button>
          </section>
        ) : (
          <section className="mb-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => {
              const dueState = getDueState(task.dueDate);

              return (
                <article
                  key={task.id}
                  className={`flex min-h-72 flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-emerald-300/40 ${
                    task.status === "Completed" ? "opacity-75" : ""
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="min-w-0 text-xl font-black leading-snug tracking-normal">
                      {task.title}
                    </h3>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityColor(task.priority || "Medium")}`}>
                      {task.priority || "Medium"} Priority
                    </span>
                    {dueState && (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getDueColor(dueState.tone)}`}>
                        {dueState.label}
                      </span>
                    )}
                  </div>

                  <p className="mb-6 line-clamp-4 flex-1 text-sm leading-relaxed text-slate-300">
                    {task.description}
                  </p>

                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => editTask(task)}
                      className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="flex-1 rounded-xl bg-rose-500/90 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">{editingId ? "Edit Task" : "Create Task"}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Keep the title clear, add context, then assign priority and timing.
              </p>
            </div>
            {editingId && (
              <button
                onClick={clearForm}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-slate-300">
              Task title
              <input
                type="text"
                placeholder="Prepare project update"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-300">
              Description
              <textarea
                placeholder="Add the details your future self will need."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-32 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Priority
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Due date
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                />
              </label>
            </div>

            <button
              onClick={editingId ? updateTask : createTask}
              disabled={!canSubmit}
              className="rounded-xl bg-emerald-300 px-5 py-4 text-base font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {editingId ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </section>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Delete this task?</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              This will permanently remove <span className="font-semibold text-white">{deleteTarget.title}</span> from your task list.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-400"
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value, tone = "slate" }) {
  const toneClass = {
    slate: "text-white",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    sky: "text-sky-300",
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <p className="mb-2 text-sm text-slate-400">{label}</p>
      <h3 className={`text-4xl font-black ${toneClass}`}>{value}</h3>
    </div>
  );
}
