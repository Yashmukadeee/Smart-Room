'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, Plus, ListTodo } from 'lucide-react';

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  created_at?: string;
}

interface TodoListProps {
  todos: TodoItem[];
  onAddTodo: (title: string) => void;
  onToggleTodo: (id: string, completed: boolean) => void;
  onDeleteTodo: (id: string) => void;
}

export function TodoList({ todos, onAddTodo, onToggleTodo, onDeleteTodo }: TodoListProps) {
  const [newTitle, setNewTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTodo(newTitle.trim());
    setNewTitle('');
  };

  const pendingCount = todos.filter(t => !t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-[320px] bg-slate-950/75 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl z-20 flex flex-col gap-3 font-sans select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            YOUR MISSIONS
          </h3>
        </div>
        <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-slate-950/80 border-slate-800 text-cyan-400">
          {pendingCount === 0 ? 'ALL CLEAR' : `${pendingCount} PENDING`}
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Assign new mission..."
          className="flex-1 bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none placeholder-slate-600 transition-colors font-mono"
        />
        <button
          type="submit"
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* List */}
      <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence initial={false}>
          {todos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="text-[10px] font-mono text-center text-slate-500 py-6"
            >
              No active missions. You&apos;re free to swing! 🕷️
            </motion.div>
          ) : (
            todos.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                  todo.completed
                    ? 'bg-slate-950/20 border-slate-950/30 opacity-50'
                    : 'bg-slate-950/40 border-slate-900/60 hover:border-slate-800'
                }`}
              >
                <div
                  onClick={() => onToggleTodo(todo.id, !todo.completed)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="shrink-0">
                    {todo.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400 transition-colors" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-mono truncate leading-normal ${
                      todo.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>
                <button
                  onClick={() => onDeleteTodo(todo.id)}
                  className="p-1 text-slate-600 hover:text-red-400 transition-colors opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
