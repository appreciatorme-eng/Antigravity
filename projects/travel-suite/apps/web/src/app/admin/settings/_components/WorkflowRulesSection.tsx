import { Bell, Globe, Save, Shield } from 'lucide-react';
import { GlassButton } from '@/components/glass/GlassButton';
import type { WorkflowRule } from '../shared';
import { workflowStageLabels } from '../shared';

interface WorkflowRulesSectionProps {
  workflowRules: WorkflowRule[];
  rulesSaving: boolean;
  toggleWorkflowRule: (stage: string) => void;
  saveWorkflowRules: () => void;
}

export function WorkflowRulesSection({
  workflowRules,
  rulesSaving,
  toggleWorkflowRule,
  saveWorkflowRules,
}: WorkflowRulesSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-secondary dark:text-white">Lifecycle Notification Rules</h2>
          <p className="text-sm text-text-secondary mt-0.5">Control automatic WhatsApp + app notifications per stage.</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          Control whether clients receive automatic WhatsApp + app notifications when moved to each lifecycle stage.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {workflowRules.map((rule) => (
            <div key={rule.lifecycle_stage} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3 dark:bg-white/5">
              <div>
                <p className="text-sm font-semibold text-secondary dark:text-white">
                  {workflowStageLabels[rule.lifecycle_stage] || rule.lifecycle_stage}
                </p>
                <p className="text-xs text-text-secondary">{rule.lifecycle_stage}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleWorkflowRule(rule.lifecycle_stage)}
                className={`relative h-7 w-12 rounded-full transition-colors ${rule.notify_client ? 'bg-primary' : 'bg-white/30 dark:bg-white/10'}`}
                aria-label={`Toggle ${rule.lifecycle_stage}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${rule.notify_client ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <GlassButton type="button" variant="primary" onClick={saveWorkflowRules} disabled={rulesSaving}>
            {rulesSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Notification Rules
          </GlassButton>
        </div>
        <div className="border-t border-white/10 pt-3">
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">System Configuration</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 dark:bg-white/5">
              <div>
                <p className="text-sm font-bold text-secondary dark:text-white">Push Notifications</p>
                <p className="text-xs text-text-secondary">Global kill switch</p>
              </div>
              <div className="relative h-6 w-10 rounded-full bg-primary">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-4 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-bold text-secondary dark:text-white">Two-Factor Auth</p>
                  <p className="text-xs text-text-secondary">Security requirement</p>
                </div>
              </div>
              <div className="relative h-6 w-10 rounded-full bg-white/30 dark:bg-white/10">
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
