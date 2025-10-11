import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectStore } from '@/store/useProjectStore';
import { Trash2, Download, RefreshCw, Image as ImageIcon, Code, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TraitLibraryTab() {
  const { traitClasses, removeTrait } = useProjectStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const allTraits = traitClasses.flatMap(tc => 
    tc.traits.map(t => ({ ...t, classId: tc.id, className: tc.name }))
  );

  const filteredTraits = allTraits.filter(trait => {
    const matchesSearch = trait.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || trait.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getTraitType = (imageSrc: string): 'static' | 'webgl' | 'p5' | 'strudel' | 'sd' => {
    if (!imageSrc) return 'static';
    if (imageSrc.startsWith('data:image')) return 'static';
    if (imageSrc.startsWith('webgl:')) return 'webgl';
    if (imageSrc.startsWith('p5:')) return 'p5';
    if (imageSrc.startsWith('strudel:')) return 'strudel';
    if (imageSrc.startsWith('sd:')) return 'sd';
    return 'static';
  };

  const getTraitTypeLabel = (type: string) => {
    const labels = {
      static: 'PNG',
      webgl: 'Shader',
      p5: 'p5.js',
      strudel: 'Audio',
      sd: 'AI Image',
    };
    return labels[type as keyof typeof labels] || 'Unknown';
  };

  const handleDownloadTrait = (trait: any) => {
    if (trait.imageSrc.startsWith('data:image')) {
      const link = document.createElement('a');
      link.download = `${trait.name}.png`;
      link.href = trait.imageSrc;
      link.click();
      toast({
        title: 'Trait downloaded',
        description: `${trait.name} saved as PNG`,
      });
    } else {
      toast({
        title: 'Procedural trait',
        description: 'This trait is procedural and must be rendered first',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTrait = (trait: any) => {
    removeTrait(trait.classId, trait.id);
    toast({
      title: 'Trait removed',
      description: `"${trait.name}" deleted from ${trait.className}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" />
            Trait Library
          </CardTitle>
          <CardDescription>
            Manage all traits across your collection. View, download, or remove traits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search Traits</Label>
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="w-64">
              <Label>Filter by Class</Label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-input text-sm"
              >
                <option value="all">All Classes</option>
                {traitClasses.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex-1">
              <div className="text-2xl font-bold text-primary">{allTraits.length}</div>
              <div className="text-xs text-muted-foreground">Total Traits</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-primary">{traitClasses.length}</div>
              <div className="text-xs text-muted-foreground">Trait Classes</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-primary">
                {allTraits.filter(t => getTraitType(t.imageSrc) === 'static').length}
              </div>
              <div className="text-xs text-muted-foreground">Static PNGs</div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-primary">
                {allTraits.filter(t => getTraitType(t.imageSrc) !== 'static').length}
              </div>
              <div className="text-xs text-muted-foreground">Procedural</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trait Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
          {filteredTraits.map(trait => {
            const type = getTraitType(trait.imageSrc);
            const isStatic = type === 'static';

            return (
              <Card key={trait.id} className="border-border bg-card overflow-hidden">
                <div className="aspect-square max-h-48 bg-muted flex items-center justify-center relative border-b border-border">
                  {isStatic && trait.imageSrc ? (
                    <img 
                      src={trait.imageSrc} 
                      alt={trait.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Code className="w-8 h-8" />
                      <div className="text-xs font-mono">{type.toUpperCase()}</div>
                    </div>
                  )}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-xs"
                  >
                    {getTraitTypeLabel(type)}
                  </Badge>
                </div>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm">{trait.name}</h3>
                    <p className="text-xs text-muted-foreground">{trait.className}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Weight: <span className="font-mono">{trait.weight}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadTrait(trait)}
                      disabled={!isStatic}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTrait(trait)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTraits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No traits found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
