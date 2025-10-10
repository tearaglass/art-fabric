import { useState, useRef } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Plus, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AssetsTab = () => {
  const { traitClasses, addTraitClass, addTrait, removeTrait, removeTraitClass } = useProjectStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newClassName, setNewClassName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, classId: string) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target?.result as string;
          
          // Parse filename for weight (e.g., "Hat__w45.png")
          const nameMatch = file.name.match(/^(.+?)(?:__w(\d+))?\.png$/);
          const traitName = nameMatch?.[1] || file.name;
          const weight = nameMatch?.[2] ? parseInt(nameMatch[2]) : 100;
          
          const traitClass = traitClasses.find(tc => tc.id === classId);
          
          addTrait(classId, {
            id: `${classId}-${Date.now()}-${Math.random()}`,
            name: traitName,
            imageSrc,
            weight,
            className: traitClass?.name || '',
          });
        };
        reader.readAsDataURL(file);
      }
    });

    toast({
      title: 'Traits uploaded',
      description: `${files.length} file(s) added successfully.`,
    });
  };

  const createNewClass = () => {
    if (!newClassName.trim()) {
      toast({
        title: 'Invalid name',
        description: 'Please enter a class name.',
        variant: 'destructive',
      });
      return;
    }

    const newClass = {
      id: `class-${Date.now()}`,
      name: newClassName,
      zIndex: traitClasses.length,
      traits: [],
    };

    addTraitClass(newClass);
    setNewClassName('');
    
    toast({
      title: 'Class created',
      description: `"${newClassName}" class added.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Class */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Create Trait Class</h2>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Background, Eyes, Hat..."
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createNewClass()}
            className="bg-input border-border"
          />
          <Button onClick={createNewClass} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </div>
      </Card>

      {/* Trait Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {traitClasses.length === 0 ? (
          <Card className="p-12 border-border bg-card col-span-full flex flex-col items-center justify-center text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trait classes yet</h3>
            <p className="text-muted-foreground mb-4">Create a class above to get started</p>
          </Card>
        ) : (
          traitClasses.map((traitClass) => (
            <Card key={traitClass.id} className="p-6 border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold gradient-text">{traitClass.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    z-index: {traitClass.zIndex} • {traitClass.traits.length} traits
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTraitClass(traitClass.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e) => handleFileUpload(e as any, traitClass.id);
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Traits
                </Button>

                {/* Trait Thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {traitClass.traits.map((trait) => (
                    <div
                      key={trait.id}
                      className="relative group aspect-square bg-muted rounded border border-border overflow-hidden"
                    >
                      <img
                        src={trait.imageSrc}
                        alt={trait.name}
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => removeTrait(traitClass.id, trait.id)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="truncate">{trait.name}</div>
                        <div className="font-mono">w: {trait.weight}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
