import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const RulesTab = () => {
  const { traitClasses, rules, addRule, removeRule } = useProjectStore();
  const { toast } = useToast();
  const [ruleType, setRuleType] = useState<'require' | 'exclude' | 'mutex'>('require');
  const [condition, setCondition] = useState('');
  const [target, setTarget] = useState('');

  const allTraits = traitClasses.flatMap((tc) =>
    tc.traits.map((t) => ({ className: tc.name, traitName: t.name, fullPath: `${tc.name}:${t.name}` }))
  );

  const handleAddRule = () => {
    if (!condition || !target) {
      toast({
        title: 'Incomplete rule',
        description: 'Select both condition and target traits.',
        variant: 'destructive',
      });
      return;
    }

    const newRule = {
      id: `rule-${Date.now()}`,
      type: ruleType,
      condition,
      target,
    };

    addRule(newRule);
    setCondition('');
    setTarget('');
    
    toast({
      title: 'Rule added',
      description: `${ruleType} rule created successfully.`,
    });
  };

  const getRuleDescription = (rule: typeof rules[0]) => {
    switch (rule.type) {
      case 'require':
        return `If ${rule.condition} is selected, ${rule.target} must also be selected`;
      case 'exclude':
        return `If ${rule.condition} is selected, ${rule.target} cannot be selected`;
      case 'mutex':
        return `${rule.condition} and ${rule.target} cannot both be selected`;
      default:
        return '';
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'require':
        return 'text-success';
      case 'exclude':
        return 'text-destructive';
      case 'mutex':
        return 'text-warning';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Rule Builder */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Create Trait Rule</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Rule Type</label>
            <Select value={ruleType} onValueChange={(v: any) => setRuleType(v)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="require">Require</SelectItem>
                <SelectItem value="exclude">Exclude</SelectItem>
                <SelectItem value="mutex">Mutex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">If this trait...</label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select trait" />
              </SelectTrigger>
              <SelectContent>
                {allTraits.map((trait) => (
                  <SelectItem key={trait.fullPath} value={trait.fullPath}>
                    {trait.fullPath}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              {ruleType === 'require' ? 'Require this' : ruleType === 'exclude' ? 'Block this' : 'Cannot have'}
            </label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select trait" />
              </SelectTrigger>
              <SelectContent>
                {allTraits.map((trait) => (
                  <SelectItem key={trait.fullPath} value={trait.fullPath}>
                    {trait.fullPath}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleAddRule} className="w-full gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded border border-border">
          <div className="text-sm font-medium mb-1">Rule Types:</div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li className="text-success">• <strong>Require:</strong> If A is picked, B must also be picked</li>
            <li className="text-destructive">• <strong>Exclude:</strong> If A is picked, B cannot be picked</li>
            <li className="text-warning">• <strong>Mutex:</strong> A and B cannot both appear together</li>
          </ul>
        </div>
      </Card>

      {/* Active Rules */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Active Rules ({rules.length})</h2>

        {rules.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No rules defined yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-start justify-between p-4 bg-muted/30 rounded border border-border"
              >
                <div className="flex-1">
                  <div className={`text-xs font-bold uppercase mb-1 ${getRuleColor(rule.type)}`}>
                    {rule.type}
                  </div>
                  <div className="text-sm">{getRuleDescription(rule)}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-2">
                    {rule.condition} → {rule.target}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeRule(rule.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
