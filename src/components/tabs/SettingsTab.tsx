import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, Download, Upload, Trash2, Zap, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { useToast } from '@/hooks/use-toast';
import { GALLERY_TEMPLATES } from '@/lib/templates/galleryTemplates';

export const SettingsTab = () => {
  const { 
    projectName, 
    setProjectName, 
    powerUserMode, 
    setPowerUserMode,
    saveProject,
    loadProject,
    resetProject 
  } = useProjectStore();
  const { toast } = useToast();

  const handleExportSettings = () => {
    const json = saveProject();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_config.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Settings exported',
      description: 'Project configuration saved to file',
    });
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          loadProject(json);
          toast({
            title: 'Settings imported',
            description: 'Project configuration loaded successfully',
          });
        } catch (error) {
          toast({
            title: 'Import failed',
            description: 'Invalid configuration file',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleResetProject = () => {
    if (confirm('Are you sure? This will delete all traits, rules, and settings.')) {
      resetProject();
      toast({
        title: 'Project reset',
        description: 'All settings restored to defaults',
      });
    }
  };

  const handleLoadTemplate = (templateData: any) => {
    const json = JSON.stringify(templateData);
    loadProject(json);
    toast({
      title: 'Template loaded!',
      description: 'Example project ready to customize',
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Project Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-2 bg-input border-border"
              placeholder="My NFT Collection"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used in exports and file names
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="powerUser">Power User Mode</Label>
                <Zap className="w-4 h-4 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">
                Unlock advanced tabs: Shader Lab, P5 Lab, Strudel, SD Lab, Performance, Debug
              </p>
            </div>
            <Switch
              id="powerUser"
              checked={powerUserMode}
              onCheckedChange={setPowerUserMode}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Example Projects</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Load pre-configured templates to get started quickly
        </p>

        <div className="grid grid-cols-1 gap-3">
          {GALLERY_TEMPLATES.map((template) => (
            <Card key={template.id} className="p-4 border-border bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{template.thumbnail}</span>
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleLoadTemplate(template.projectData)}
                  className="gradient-primary shrink-0"
                >
                  Load
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">Import/Export</h2>

        <div className="space-y-3">
          <Button
            onClick={handleExportSettings}
            variant="outline"
            className="w-full justify-start"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Project Configuration
          </Button>

          <Button
            onClick={handleImportSettings}
            variant="outline"
            className="w-full justify-start"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Project Configuration
          </Button>

          <Separator />

          <Button
            onClick={handleResetProject}
            variant="destructive"
            className="w-full justify-start"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Project to Defaults
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card">
        <h2 className="text-xl font-bold mb-4">About</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">LaneyGen</strong> - Multi-modal NFT Generator</p>
          <p>Version: 1.0.0</p>
          <p>Built with React, WebGL, p5.js, Strudel</p>
          <p className="pt-2 border-t border-border mt-4">
            © 2025 LaneyGen. Open source under MIT license.
          </p>
        </div>
      </Card>
    </div>
  );
};
