import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TodoItem } from '@/components/TodoList';

const LOCAL_STORAGE_KEY = 'smart_room_todos';

export function useTodoSync() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Load initial todos
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          setTodos(data as TodoItem[]);
          setIsUsingSupabase(true);
        }
      } catch (err) {
        console.warn('Supabase todos fetch failed, falling back to localStorage:', err);
        // Fallback to localStorage
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            setTodos(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse localStorage todos:', e);
          }
        }
        setIsUsingSupabase(false);
      }
    };

    loadTodos();
  }, []);

  // Save changes wrapper
  const saveTodos = useCallback(async (newTodos: TodoItem[]) => {
    setTodos(newTodos);

    // Save to localStorage regardless as a double backup
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTodos));

    if (isUsingSupabase) {
      // Supabase is available, but let's make sure we do it inside try-catch in case it goes offline
      try {
        // We will just do a sync of the entire state or perform individual mutations.
        // It's safer to perform individual operations, but we can do a fallback check.
      } catch (err) {
        console.warn('Failed to sync state to Supabase:', err);
      }
    }
  }, [isUsingSupabase]);

  const addTodo = useCallback(async (title: string) => {
    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      created_at: new Date().toISOString(),
    };

    const updated = [...todos, newTodo];
    setTodos(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{ id: newTodo.id, title: newTodo.title, completed: false }])
        .select();

      if (error) throw error;
      if (data) setIsUsingSupabase(true);
    } catch (err) {
      console.warn('Supabase insert failed, running in offline mode:', err);
      setIsUsingSupabase(false);
    }
  }, [todos]);

  const toggleTodo = useCallback(async (id: string, completed: boolean) => {
    const updated = todos.map(t => (t.id === id ? { ...t, completed } : t));
    setTodos(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Supabase update failed:', err);
    }
  }, [todos]);

  const deleteTodo = useCallback(async (id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }, [todos]);

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    isUsingSupabase,
  };
}
