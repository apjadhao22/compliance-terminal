import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const ACT_OPTIONS = [
  'EPF Act', 'ESI Act', 'POSH Act', 'Factories Act', 'Payment of Wages Act',
  'Minimum Wages Act', 'Payment of Bonus Act', 'Payment of Gratuity Act',
  'Industrial Disputes Act', 'Shops & Establishments Act', 'Contract Labour Act',
  'Professional Tax', 'Maternity Benefit Act', 'Equal Remuneration Act',
];

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AddTaskSheet: React.FC<AddTaskSheetProps> = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', act_reference: '', due_date: '',
    assigned_to: '', is_recurring: false, recurrence_pattern: 'monthly',
  });

  const handleSubmit = async () => {
    if (!user || !form.title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const { error } = await supabase.from('compliance_tasks').insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description || null,
      act_reference: form.act_reference || null,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      is_recurring: form.is_recurring,
      recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
      status: 'todo',
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Task created' });
      setForm({ title: '', description: '', act_reference: '', due_date: '', assigned_to: '', is_recurring: false, recurrence_pattern: 'monthly' });
      onCreated();
      onClose();
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="bg-card border-border w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm text-primary">ADD COMPLIANCE TASK</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground">Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="font-mono text-xs bg-secondary border-border" placeholder="e.g. File EPF returns" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="font-mono text-xs bg-secondary border-border min-h-[80px]" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground">Act Reference</Label>
            <Select value={form.act_reference} onValueChange={v => setForm(f => ({ ...f, act_reference: v }))}>
              <SelectTrigger className="font-mono text-xs bg-secondary"><SelectValue placeholder="Select act..." /></SelectTrigger>
              <SelectContent>
                {ACT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground">Due Date</Label>
            <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="font-mono text-xs bg-secondary border-border" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground">Assigned To</Label>
            <Input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} className="font-mono text-xs bg-secondary border-border" placeholder="Name or email" />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono text-muted-foreground">Is Recurring</Label>
            <Switch checked={form.is_recurring} onCheckedChange={v => setForm(f => ({ ...f, is_recurring: v }))} />
          </div>

          {form.is_recurring && (
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground">Recurrence</Label>
              <Select value={form.recurrence_pattern} onValueChange={v => setForm(f => ({ ...f, recurrence_pattern: v }))}>
                <SelectTrigger className="font-mono text-xs bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={saving} className="w-full font-mono text-xs">
            <Save className="h-3 w-3 mr-1" />{saving ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
