import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BarChart3 } from 'lucide-react';

export const DistributionTab = () => {
  const { traitClasses, updateTrait } = useProjectStore();

  const calculateRarity = (weight: number, totalWeight: number) => {
    return ((weight / totalWeight) * 100).toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Rarity Distribution</h2>
        <p className="text-sm text-muted-foreground">
          Adjust trait weights to control rarity. Higher weight = more common.
        </p>
      </Card>

      {traitClasses.length === 0 ? (
        <Card className="p-12 border-border bg-card flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No trait classes yet</h3>
          <p className="text-muted-foreground">Add traits in the Assets tab first</p>
        </Card>
      ) : (
        traitClasses.map((traitClass) => {
          const totalWeight = traitClass.traits.reduce((sum, t) => sum + t.weight, 0);

          return (
            <Card key={traitClass.id} className="p-6 border-border bg-card">
              <h3 className="text-lg font-bold gradient-text mb-4">{traitClass.name}</h3>

              <div className="space-y-3">
                {traitClass.traits.map((trait) => {
                  const rarity = calculateRarity(trait.weight, totalWeight);

                  return (
                    <div
                      key={trait.id}
                      className="grid grid-cols-12 gap-4 items-center p-3 bg-muted/30 rounded border border-border"
                    >
                      <div className="col-span-5">
                        <div className="font-medium">{trait.name}</div>
                      </div>

                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          max={1000}
                          value={trait.weight}
                          onChange={(e) =>
                            updateTrait(traitClass.id, trait.id, {
                              weight: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-input border-border font-mono text-sm"
                        />
                      </div>

                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full gradient-primary transition-all duration-300"
                              style={{ width: `${rarity}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground w-16 text-right">
                            {rarity}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground font-mono">
                  Total Weight: {totalWeight}
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};
