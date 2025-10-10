import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, FolderOpen, FileDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProjectHeader = () => {
  const { projectName, setProjectName, saveProject, loadProject, resetProject } = useProjectStore();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    const json = saveProject();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.laney.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Project saved',
      description: 'Your project has been exported successfully.',
    });
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.laney.json,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          loadProject(content);
          toast({
            title: 'Project loaded',
            description: 'Your project has been imported successfully.',
          });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleNew = () => {
    if (confirm('Create a new project? Current progress will be lost unless saved.')) {
      resetProject();
      toast({
        title: 'New project created',
      });
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold gradient-text">LaneyGen</h1>
          
          {isEditing ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              className="w-64 bg-input border-border"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-lg font-medium hover:text-primary transition-colors font-mono"
            >
              {projectName}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleLoad}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Load
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>
    </header>
  );
};
