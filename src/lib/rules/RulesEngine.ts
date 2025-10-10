import { Rule, Trait } from '@/store/useProjectStore';

export interface ValidationResult {
  valid: boolean;
  violations: RuleViolation[];
}

export interface RuleViolation {
  ruleId: string;
  type: 'require' | 'exclude' | 'mutex';
  message: string;
  condition: string;
  target: string;
}

export class RulesEngine {
  /**
   * Validates a set of selected traits against defined rules
   */
  static validate(selectedTraits: Trait[], rules: Rule[]): ValidationResult {
    const violations: RuleViolation[] = [];
    const traitIds = new Set(selectedTraits.map(t => t.id));

    for (const rule of rules) {
      const hasCondition = traitIds.has(rule.condition);
      const hasTarget = traitIds.has(rule.target);

      switch (rule.type) {
        case 'require':
          // If condition trait is present, target MUST be present
          if (hasCondition && !hasTarget) {
            violations.push({
              ruleId: rule.id,
              type: 'require',
              condition: rule.condition,
              target: rule.target,
              message: `Trait "${this.getTraitName(selectedTraits, rule.condition)}" requires "${this.getTraitName(selectedTraits, rule.target)}" but it's missing`
            });
          }
          break;

        case 'exclude':
          // If condition trait is present, target MUST NOT be present
          if (hasCondition && hasTarget) {
            violations.push({
              ruleId: rule.id,
              type: 'exclude',
              condition: rule.condition,
              target: rule.target,
              message: `Trait "${this.getTraitName(selectedTraits, rule.condition)}" excludes "${this.getTraitName(selectedTraits, rule.target)}"`
            });
          }
          break;

        case 'mutex':
          // Both traits cannot be present at the same time
          if (hasCondition && hasTarget) {
            violations.push({
              ruleId: rule.id,
              type: 'mutex',
              condition: rule.condition,
              target: rule.target,
              message: `Traits "${this.getTraitName(selectedTraits, rule.condition)}" and "${this.getTraitName(selectedTraits, rule.target)}" are mutually exclusive`
            });
          }
          break;
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Attempts to fix violations by removing conflicting traits
   * Returns a new array of traits with violations resolved
   */
  static autoFix(selectedTraits: Trait[], rules: Rule[]): Trait[] {
    let fixed = [...selectedTraits];
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      const result = this.validate(fixed, rules);
      
      if (result.valid) {
        break;
      }

      // Remove the target trait from the first violation
      const violation = result.violations[0];
      fixed = fixed.filter(t => t.id !== violation.target);
      
      iteration++;
    }

    return fixed;
  }

  /**
   * Helper to get trait name from ID
   */
  private static getTraitName(traits: Trait[], id: string): string {
    return traits.find(t => t.id === id)?.name || id;
  }

  /**
   * Check if a specific trait can be added given current selection
   */
  static canAddTrait(trait: Trait, currentTraits: Trait[], rules: Rule[]): ValidationResult {
    const testTraits = [...currentTraits, trait];
    return this.validate(testTraits, rules);
  }

  /**
   * Get all rules that affect a specific trait
   */
  static getRulesForTrait(traitId: string, rules: Rule[]): Rule[] {
    return rules.filter(r => r.condition === traitId || r.target === traitId);
  }
}
