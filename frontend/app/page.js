"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [tasks, setTasks] = useState([]);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
  });

  const [editingId, setEditingId] = useState(null);

  // FETCH TASKS
  const fetchTasks = async () => {
    try {
      const res = await fetch("http://localhost:3001/tasks");

      const data = await res.json();

      setTasks(data.reverse());
    } catch (error) {
      toast.error("Failed to fetch tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // CREATE TASK
  const createTask = async () => {
    if (!form.title || !form.description) {
      toast.error("Please complete all fields");
      return;
    }

    try {
      await fetch("http://localhost:3001/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      toast.success("Task created successfully");

      fetchTasks();
      clearForm();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  // DELETE TASK
  const deleteTask = async (id) => {
    try {
      await fetch(`http://localhost:3001/tasks/${id}`, {
        method: "DELETE",
      });

      toast.success("Task deleted");

      fetchTasks();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // EDIT TASK
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

  // UPDATE TASK
  const updateTask = async () => {
    try {
      await fetch(`http://localhost:3001/tasks/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      toast.success("Task updated successfully");

      setEditingId(null);

      fetchTasks();
      clearForm();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  // CLEAR FORM
  const clearForm = () => {
    setForm({
      title: "",
      description: "",
      status: "Pending",
      priority: "Medium",
      dueDate: "",
    });
  };

  // FILTER + PRIORITY SORT
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );

    const priorityOrder = {
      High: 1,
      Medium: 2,
      Low: 3,
    };

    return filtered.sort((a, b) => {
      return (
        priorityOrder[a.priority || "Medium"] -
        priorityOrder[b.priority || "Medium"]
      );
    });
  }, [tasks, search]);

  // COUNTERS
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "Pending"
  ).length;

  const progressTasks = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  // STATUS COLORS
  const getStatusColor = (status) => {
    if (status === "Completed") {
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    }

    if (status === "In Progress") {
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    }

    return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
  };

  // PRIORITY COLORS
  const getPriorityColor = (priority) => {
    if (priority === "High") {
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    }

    if (priority === "Medium") {
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    }

    return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">

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

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-500/20">
              T
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-wide">
                TaskFlow
              </h1>

              <p className="text-xs text-gray-400">
                Productivity Dashboard
              </p>
            </div>

          </div>

          <div className="hidden md:flex items-center gap-3 text-sm text-gray-400">
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              {new Date().toLocaleDateString()}
            </div>
          </div>

        </div>
      </nav>

      <div className="px-6 py-12">

        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="mb-12 text-center">
            <h1 className="text-6xl font-black leading-tight tracking-normal mb-4 bg-gradient-to-r from-white via-blue-200 to-cyan-300 text-transparent bg-clip-text">
              Organize Your Workflow
            </h1>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Manage tasks, monitor progress, and stay productive with your modern productivity dashboard.
            </p>
          </div>

          {/* COUNTERS */}
          <div className="grid md:grid-cols-4 gap-5 mb-10">

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <p className="text-gray-400 mb-2">Total Tasks</p>
              <h2 className="text-5xl font-black">{totalTasks}</h2>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <p className="text-green-300 mb-2">Completed</p>
              <h2 className="text-5xl font-black text-green-400">
                {completedTasks}
              </h2>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <p className="text-yellow-300 mb-2">Pending</p>
              <h2 className="text-5xl font-black text-yellow-300">
                {pendingTasks}
              </h2>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <p className="text-blue-300 mb-2">In Progress</p>
              <h2 className="text-5xl font-black text-blue-400">
                {progressTasks}
              </h2>
            </div>

          </div>

          {/* SEARCH */}
          <div className="mb-10">
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-5 outline-none focus:border-blue-500 text-lg"
            />
          </div>

          {/* TASK LABEL */}
          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-3xl font-black">
                Prioritized Tasks
              </h2>

              <p className="text-gray-400 mt-1">
                High priority tasks appear first automatically
              </p>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-300">
              {filteredTasks.length} Tasks Found
            </div>

          </div>

          {/* EMPTY STATE */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-20 text-center backdrop-blur-xl shadow-2xl mb-14">

              <div className="text-7xl mb-6">
                📋
              </div>

              <h2 className="text-4xl font-black mb-4">
                No Tasks Found
              </h2>

              <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
                Start building your productivity workflow by creating your first task.
              </p>

            </div>
          ) : (

            /* TASKS */
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 mb-14">

              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2rem] p-7 hover:scale-[1.02] transition-all duration-300 shadow-2xl"
                >

                  <div className="flex items-start justify-between gap-4 mb-5">

                    <h3 className="text-2xl font-black break-words leading-tight">
                      {task.title}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${getStatusColor(task.status)}`}
                    >
                      {task.status}
                    </span>

                  </div>

                  <div className="flex gap-2 mb-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority || "Medium")}`}
                    >
                      {task.priority || "Medium"} Priority
                    </span>
                  </div>

                  <p className="text-gray-300 leading-relaxed mb-6">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between mb-8 text-sm text-gray-400">
                    <p>
                      Due: {task.dueDate || "No due date"}
                    </p>
                  </div>

                  <div className="flex gap-3">

                    <button
                      onClick={() => editTask(task)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 transition-all py-3 rounded-2xl font-bold shadow-lg shadow-yellow-500/20"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 transition-all py-3 rounded-2xl font-bold shadow-lg shadow-red-600/20"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

          {/* FORM */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">

            <h2 className="text-3xl font-black mb-8">
              {editingId ? "Edit Task" : "Quick Task Creator"}
            </h2>

            <div className="grid gap-5">

              <input
                type="text"
                placeholder="Task title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="bg-gray-900/70 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
              />

              <textarea
                placeholder="Task description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                className="bg-gray-900/70 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 min-h-[120px]"
              />

              <div className="grid md:grid-cols-3 gap-4">

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  className="bg-gray-900/70 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                  className="bg-gray-900/70 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dueDate: e.target.value,
                    })
                  }
                  className="bg-gray-900/70 border border-gray-700 rounded-2xl px-5 py-4 outline-none focus:border-blue-500"
                />

              </div>

              {editingId ? (
                <button
                  onClick={updateTask}
                  className="bg-green-600 hover:bg-green-700 transition-all py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-600/20"
                >
                  Update Task
                </button>
              ) : (
                <button
                  onClick={createTask}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 transition-all py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20"
                >
                  Create Task
                </button>
              )}

            </div>
          </div>

        </div>

      </div>

    </main>
  );
}