import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar, User, Paperclip, Trash2, Upload, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['compliance_tasks']['Row'];

interface KanbanCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  isDragging?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onDelete, onUpdate, isDragging }) => {
  const [uploading, setUploading] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const getPriorityColor = () => {
    if (task.status === 'overdue') return 'border-destructive/40 bg-destructive/5';
    if (task.act_reference && ['EPF', 'ESI', 'POSH', 'Factories'].some(k => task.act_reference!.includes(k)))
      return 'border-warning/30 bg-warning/5';
    return 'border-border bg-card';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const filePath = `${task.user_id}/${task.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('evidence').upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(filePath);
    const newUrls = [...(task.evidence_urls || []), urlData.publicUrl];
    await supabase.from('compliance_tasks').update({ evidence_urls: newUrls }).eq('id', task.id);
    toast({ title: 'Evidence uploaded' });
    setUploading(false);
    onUpdate();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-3 py-2.5 rounded border cursor-grab active:cursor-grabbing transition-colors ${getPriorityColor()} ${isDragging ? 'shadow-lg ring-1 ring-primary/30' : ''}`}
    >
      {/* Act reference badge */}
      {task.act_reference && (
        <Badge variant="outline" className="text-[9px] font-mono mb-1.5 px-1.5 py-0">
          {task.act_reference}
        </Badge>
      )}

      {/* Title */}
      <h4 className="text-[11px] font-mono text-foreground leading-tight mb-1.5 line-clamp-2">{task.title}</h4>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.due_date && (
          <span className={`flex items-center gap-0.5 text-[9px] font-mono ${
            task.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            <Calendar className="h-2.5 w-2.5" />
            {format(new Date(task.due_date), 'dd MMM')}
          </span>
        )}
        {task.assigned_to && (
          <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground">
            <User className="h-2.5 w-2.5" />
            {task.assigned_to}
          </span>
        )}
        {task.is_recurring && (
          <span title={`Recurring: ${task.recurrence_pattern}`}><RefreshCw className="h-2.5 w-2.5 text-accent" /></span>
        )}
        {task.evidence_urls && task.evidence_urls.length > 0 && (
          <span className="flex items-center gap-0.5 text-[9px] font-mono text-primary">
            <Paperclip className="h-2.5 w-2.5" />
            {task.evidence_urls.length}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-border">
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          <span className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground hover:text-primary transition-colors">
            <Upload className="h-2.5 w-2.5" />
            {uploading ? 'Uploading...' : 'Evidence'}
          </span>
        </label>
        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
