import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { AddTaskSheet } from '@/components/kanban/AddTaskSheet';
import { Button } from '@/components/ui/button';
import { LayoutGrid, AlertTriangle, Plus, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['compliance_tasks']['Row'];

const COLUMNS = [
  { id: 'todo', label: 'TO DO', color: 'text-primary' },
  { id: 'in_progress', label: 'IN PROGRESS', color: 'text-accent' },
  { id: 'filed', label: 'FILED', color: 'text-terminal-green' },
  { id: 'overdue', label: 'OVERDUE', color: 'text-destructive' },
];

const CHECKLIST_TEMPLATES = [
  { name: 'EPF Monthly Checklist', items: ['Calculate EPF contributions', 'File ECR on EPFO portal', 'Pay contributions by 15th', 'Download payment challan', 'Update employee records'] },
  { name: 'ESI Half-Yearly Checklist', items: ['Verify employee ESI eligibility', 'File ESI returns', 'Pay contributions', 'Generate contribution statements', 'Update employee IP details'] },
  { name: 'Factory Annual Return', items: ['Compile worker statistics', 'Prepare safety audit report', 'File annual return Form 22', 'Update factory license', 'Submit compliance certificate'] },
  { name: 'POSH Annual Report', items: ['Compile complaint statistics', 'Prepare annual report', 'Submit to District Officer', 'Update ICC members', 'Conduct awareness training'] },
  { name: 'PT Monthly', items: ['Calculate PT deductions', 'File PT return', 'Pay to treasury', 'Issue PT receipts', 'Update salary records'] },
  { name: 'Maternity Benefit Register', items: ['Update maternity leave records', 'Verify benefit calculations', 'Process payments', 'File Form N', 'Maintain register entries'] },
];

const KanbanPage: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('compliance_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      // Auto-mark overdue
      const now = new Date();
      const processed = data.map(t => {
        if (t.due_date && new Date(t.due_date) < now && t.status !== 'filed') {
          return { ...t, status: 'overdue' };
        }
        return t;
      });
      setTasks(processed);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { requireAuth(); return; }
    fetchTasks();
  }, [user, fetchTasks]);

  const getColumnTasks = (columnId: string) => tasks.filter(t => t.status === columnId);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Determine target column
    let targetColumn = over.id as string;
    if (!COLUMNS.find(c => c.id === targetColumn)) {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) targetColumn = overTask.status || 'todo';
    }

    if (task.status === targetColumn) return;

    // Update locally
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetColumn } : t));

    // Update in DB
    await supabase.from('compliance_tasks').update({ status: targetColumn }).eq('id', taskId);

    // If moved to 'filed' — handle recurring + health score
    if (targetColumn === 'filed') {
      await handleTaskFiled(task);
    }

    toast({ title: `Task moved to ${targetColumn.replace('_', ' ').toUpperCase()}` });
  };

  const handleTaskFiled = async (task: Task) => {
    if (!user) return;

    // Recurring task: create next occurrence
    if (task.is_recurring && task.recurrence_pattern && task.due_date) {
      const dueDate = new Date(task.due_date);
      switch (task.recurrence_pattern) {
        case 'monthly': dueDate.setMonth(dueDate.getMonth() + 1); break;
        case 'quarterly': dueDate.setMonth(dueDate.getMonth() + 3); break;
        case 'annually': dueDate.setFullYear(dueDate.getFullYear() + 1); break;
      }
      const { data: newTask } = await supabase.from('compliance_tasks').insert({
        user_id: user.id,
        title: task.title,
        description: task.description,
        act_reference: task.act_reference,
        due_date: dueDate.toISOString().split('T')[0],
        assigned_to: task.assigned_to,
        is_recurring: true,
        recurrence_pattern: task.recurrence_pattern,
        status: 'todo',
      }).select().single();
      if (newTask) {
        setTasks(prev => [newTask, ...prev]);
        toast({ title: `Recurring task created: due ${dueDate.toLocaleDateString()}` });
      }
    }

    // Health score recovery
    const { data: profile } = await supabase.from('liability_profiles').select('id, health_score').eq('user_id', user.id).single();
    if (profile) {
      // Determine priority from act_reference
      const isHighPriority = task.act_reference && ['EPF', 'ESI', 'POSH', 'Factories'].some(k => task.act_reference!.includes(k));
      const delta = isHighPriority ? 5 : task.act_reference ? 3 : 2;
      const newScore = Math.min(100, (profile.health_score || 0) + delta);
      await supabase.from('liability_profiles').update({ health_score: newScore }).eq('id', profile.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('compliance_tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: 'Task deleted' });
  };

  const applyTemplate = async (template: typeof CHECKLIST_TEMPLATES[0]) => {
    if (!user) return;
    const newTasks = template.items.map(item => ({
      user_id: user.id,
      title: item,
      description: `From template: ${template.name}`,
      act_reference: template.name.split(' ')[0],
      status: 'todo' as const,
    }));

    const { data } = await supabase.from('compliance_tasks').insert(newTasks).select();
    if (data) {
      setTasks(prev => [...data, ...prev]);
      toast({ title: `${template.name} applied — ${data.length} tasks created` });
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header /><AuthModal />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LayoutGrid className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
            <h1 className="text-xl font-mono font-bold text-primary glow-green mb-2">COMPLIANCE KANBAN</h1>
            <div className="flex items-center gap-2 justify-center text-sm text-warning font-mono">
              <AlertTriangle className="h-4 w-4" /> Login required
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header /><AuthModal />

      <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
        <h1 className="text-sm font-mono font-bold text-primary glow-green flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" /> COMPLIANCE KANBAN
        </h1>
        <div className="flex items-center gap-2">
          {/* Checklist Templates Dropdown */}
          <div className="relative group">
            <Button variant="outline" size="sm" className="font-mono text-xs">
              <FileText className="h-3 w-3 mr-1" /> Templates
            </Button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded shadow-lg z-50 hidden group-hover:block">
              {CHECKLIST_TEMPLATES.map(t => (
                <button key={t.name} onClick={() => applyTemplate(t)} className="w-full text-left px-3 py-2 text-xs font-mono text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors">
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setShowAddTask(true)} size="sm" className="font-mono text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(col => (
              <KanbanColumn key={col.id} id={col.id} label={col.label} color={col.color} count={getColumnTasks(col.id).length}>
                <SortableContext items={getColumnTasks(col.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                  {getColumnTasks(col.id).map(task => (
                    <KanbanCard key={task.id} task={task} onDelete={handleDeleteTask} onUpdate={fetchTasks} />
                  ))}
                </SortableContext>
              </KanbanColumn>
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <KanbanCard task={activeTask} onDelete={() => {}} onUpdate={() => {}} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AddTaskSheet open={showAddTask} onClose={() => setShowAddTask(false)} onCreated={fetchTasks} />
    </div>
  );
};

export default KanbanPage;
