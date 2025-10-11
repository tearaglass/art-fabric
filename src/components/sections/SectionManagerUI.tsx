/**
 * SectionManagerUI - Performance section manager interface
 */

import { useEffect, useState } from 'react';
import { sectionManager } from '@/lib/sections/SectionManager';
import { Section } from '@/lib/sections/Section';
import { SectionCard } from './SectionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Camera, Download, Upload, 
  ChevronLeft, ChevronRight, Zap 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SectionManagerUI() {
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [transitionType, setTransitionType] = useState<'cut' | 'fade' | 'crossfade'>('cut');
  const { toast } = useToast();
  
  // Subscribe to section manager changes
  useEffect(() => {
    const refresh = () => {
      setSections([...sectionManager.getSections()]);
      setCurrentSection(sectionManager.getCurrentSection());
    };
    
    const unsub = sectionManager.on(refresh);
    refresh();
    
    return unsub;
  }, []);
  
  const handleCapture = () => {
    const section = sectionManager.captureCurrentState();
    
    toast({
      title: 'Section Captured',
      description: `Created "${section.config.name}"`,
    });
  };
  
  const handleTrigger = (sectionId: string) => {
    sectionManager.triggerSection(sectionId, {
      type: transitionType,
      duration: transitionType === 'cut' ? 0 : 4,
    }).catch(err => {
      toast({
        title: 'Trigger Failed',
        description: err.message,
        variant: 'destructive',
      });
    });
  };
  
  const handleUpdate = (sectionId: string, updates: Partial<Section['config']>) => {
    const section = sectionManager.getSection(sectionId);
    if (section) {
      section.update(updates);
      setSections([...sectionManager.getSections()]);
    }
  };
  
  const handleClone = (sectionId: string) => {
    const section = sectionManager.getSection(sectionId);
    if (section) {
      const cloned = section.clone();
      sectionManager.addSection(cloned.config);
      
      toast({
        title: 'Section Cloned',
        description: `Created "${cloned.config.name}"`,
      });
    }
  };
  
  const handleRemove = (sectionId: string) => {
    sectionManager.removeSection(sectionId);
    
    toast({
      title: 'Section Removed',
    });
  };
  
  const handlePrevious = () => {
    sectionManager.previousSection({
      type: transitionType,
      duration: transitionType === 'cut' ? 0 : 4,
    }).catch(err => {
      toast({
        title: 'Navigation Failed',
        description: err.message,
        variant: 'destructive',
      });
    });
  };
  
  const handleNext = () => {
    sectionManager.nextSection({
      type: transitionType,
      duration: transitionType === 'cut' ? 0 : 4,
    }).catch(err => {
      toast({
        title: 'Navigation Failed',
        description: err.message,
        variant: 'destructive',
      });
    });
  };
  
  const handleExport = () => {
    const json = sectionManager.exportSections();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sections-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Sections Exported',
      description: `Saved ${sections.length} sections`,
    });
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          sectionManager.importSections(json);
          
          toast({
            title: 'Sections Imported',
            description: `Loaded ${sectionManager.getSections().length} sections`,
          });
        } catch (err) {
          toast({
            title: 'Import Failed',
            description: 'Invalid section file',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };
  
  return (
    <div className="h-full flex flex-col gap-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Section Manager
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              
              <Button size="sm" onClick={handleCapture}>
                <Camera className="w-4 h-4 mr-1" />
                Capture
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevious}
                disabled={sections.length === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-xs text-muted-foreground min-w-[100px] text-center">
                {currentSection ? currentSection.config.name : 'No section'}
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={sections.length === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Transition Type */}
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Transition:</span>
              <Select value={transitionType} onValueChange={(v: any) => setTransitionType(v)}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cut">Cut</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="crossfade">Crossfade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {sections.length} {sections.length === 1 ? 'section' : 'sections'}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Section Grid */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sections</CardTitle>
        </CardHeader>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {sections.length === 0 ? (
              <div className="col-span-full text-center text-sm text-muted-foreground py-12">
                <div className="mb-4">
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground/50" />
                </div>
                <p className="mb-2">No sections yet.</p>
                <p className="text-xs">Click "Capture" to save the current state as a section.</p>
              </div>
            ) : (
              sections.map((section) => (
                <SectionCard
                  key={section.config.id}
                  section={section}
                  isActive={currentSection?.config.id === section.config.id}
                  onTrigger={handleTrigger}
                  onUpdate={handleUpdate}
                  onClone={handleClone}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
