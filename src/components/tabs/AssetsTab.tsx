import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, Plus, X, ImageIcon, Loader2, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { TraitRenderer } from '@/lib/rendering/TraitRenderer';

type TraitModality = 'image' | 'webgl' | 'p5' | 'strudel' | 'sd';

const getTraitModality = (imageSrc: string): TraitModality => {
  if (imageSrc.startsWith('webgl:')) return 'webgl';
  if (imageSrc.startsWith('p5:')) return 'p5';
  if (imageSrc.startsWith('strudel:')) return 'strudel';
  if (imageSrc.startsWith('sd:')) return 'sd';
  return 'image';
};

const getModalityBadge = (modality: TraitModality) => {
  switch (modality) {
    case 'webgl': return { label: '⚡ Shader', variant: 'default' as const };
    case 'p5': return { label: '🎨 P5', variant: 'secondary' as const };
    case 'strudel': return { label: '🎵 Audio', variant: 'outline' as const };
    case 'sd': return { label: '🤖 AI', variant: 'destructive' as const };
    default: return null;
  }
};

const TraitPreview = ({ trait, onRemove }: { trait: any; onRemove: () => void }) => {
  const [rendering, setRendering] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modality = getTraitModality(trait.imageSrc);
  const badge = getModalityBadge(modality);

  useEffect(() => {
    const renderPreview = async () => {
      if (modality === 'image') {
        setPreviewSrc(trait.imageSrc);
        return;
      }

      if (modality === 'strudel') {
        // Just show audio icon for Strudel
        return;
      }

      setRendering(true);
      try {
        const renderer = new TraitRenderer();
        const canvas = await renderer.renderTrait(trait, 256, 256, 'preview');
        setPreviewSrc(canvas.toDataURL());
      } catch (error) {
        console.error('Preview render failed:', error);
      } finally {
        setRendering(false);
      }
    };

    renderPreview();
  }, [trait.imageSrc, modality]);

  return (
    <div className="relative group aspect-square bg-muted rounded border border-border overflow-hidden">
      {badge && (
        <Badge 
          variant={badge.variant} 
          className="absolute top-1 left-1 z-10 text-xs"
        >
          {badge.label}
        </Badge>
      )}

      {rendering ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : modality === 'strudel' ? (
        <div className="w-full h-full flex items-center justify-center">
          <Music className="w-12 h-12 text-muted-foreground" />
        </div>
      ) : previewSrc ? (
        <img
          src={previewSrc}
          alt={trait.name}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          Error
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="truncate">{trait.name}</div>
        <div className="font-mono">w: {trait.weight}</div>
      </div>
    </div>
  );
};

export const AssetsTab = () => {
  const { traitClasses, addTraitClass, addTrait, removeTrait, removeTraitClass, addFolder, removeFolder } = useProjectStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newFolderName, setNewFolderName] = useState<{[key: string]: string}>({});
  const [selectedFolder, setSelectedFolder] = useState<{[key: string]: string | null}>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, classId: string, folderId?: string) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target?.result as string;
          
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
            folderId,
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

  const createFolder = (classId: string) => {
    const folderName = newFolderName[classId]?.trim();
    if (!folderName) return;

    addFolder(classId, {
      id: `folder-${Date.now()}`,
      name: folderName,
    });

    setNewFolderName({ ...newFolderName, [classId]: '' });
    
    toast({
      title: 'Folder created',
      description: `"${folderName}" folder added.`,
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
      folders: [],
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
                <div className="flex gap-2">
                  <Input
                    placeholder="New folder..."
                    value={newFolderName[traitClass.id] || ''}
                    onChange={(e) => setNewFolderName({ ...newFolderName, [traitClass.id]: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && createFolder(traitClass.id)}
                    className="bg-input border-border text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => createFolder(traitClass.id)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {traitClass.folders.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant={selectedFolder[traitClass.id] === null ? "default" : "outline"}
                      className="text-xs"
                      onClick={() => setSelectedFolder({ ...selectedFolder, [traitClass.id]: null })}
                    >
                      All
                    </Button>
                    {traitClass.folders.map((folder) => (
                      <div key={folder.id} className="relative group/folder">
                        <Button
                          size="sm"
                          variant={selectedFolder[traitClass.id] === folder.id ? "default" : "outline"}
                          className="text-xs pr-6"
                          onClick={() => setSelectedFolder({ ...selectedFolder, [traitClass.id]: folder.id })}
                        >
                          {folder.name}
                        </Button>
                        <button
                          onClick={() => removeFolder(traitClass.id, folder.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e) => handleFileUpload(e as any, traitClass.id, selectedFolder[traitClass.id] || undefined);
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Traits {selectedFolder[traitClass.id] && `to ${traitClass.folders.find(f => f.id === selectedFolder[traitClass.id])?.name}`}
                </Button>

                {/* Trait Thumbnails */}
                <div className="grid grid-cols-4 gap-2">
                  {traitClass.traits
                    .filter((trait) => 
                      selectedFolder[traitClass.id] === null || 
                      selectedFolder[traitClass.id] === undefined ||
                      trait.folderId === selectedFolder[traitClass.id]
                    )
                    .map((trait) => (
                      <TraitPreview
                        key={trait.id}
                        trait={trait}
                        onRemove={() => removeTrait(traitClass.id, trait.id)}
                      />
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
