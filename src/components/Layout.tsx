import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileImage, GitBranch, BarChart3, Wand2, Play, Download, Radio, Zap, Settings, Library, Sparkles } from 'lucide-react';
import { ProjectHeader } from './ProjectHeader';
import { QuickStartTour } from './QuickStartTour';
import { ErrorBoundary } from './ErrorBoundary';
import CollectionTab from './tabs/CollectionTab';
import { FXBuilderTab } from './tabs/FXBuilderTab';
import { PreviewTab } from './tabs/PreviewTab';
import { ExportTab } from './tabs/ExportTab';
import { LabsTab } from './tabs/LabsTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { PowerUserPanel } from './debug/PowerUserPanel';
import { SettingsTab } from './tabs/SettingsTab';
import { TraitLibraryTab } from './tabs/TraitLibraryTab';
import { PointerLayer } from './strudel/PointerLayer';
import { AffectOverlay } from './affect/AffectOverlay';
import { useProjectStore } from '@/store/useProjectStore';

interface LayoutProps {
  children?: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { powerUserMode } = useProjectStore();

  return (
    <div className="min-h-screen flex flex-col w-full">
      <ProjectHeader />
      <QuickStartTour />
      <PointerLayer />
      <AffectOverlay />
      
      <main className="flex-1 container mx-auto px-6 py-6">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className={`grid w-full ${powerUserMode ? 'grid-cols-9' : 'grid-cols-5'} mb-6 bg-card border border-border`}>
            <TabsTrigger value="collection" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Library className="w-4 h-4 mr-2" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="fx" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Wand2 className="w-4 h-4 mr-2" />
              FX Builder
            </TabsTrigger>
            {powerUserMode && (
              <>
                <TabsTrigger value="labs" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground" data-tour="labs">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Labs
                </TabsTrigger>
                <TabsTrigger value="traitlibrary" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                  <Radio className="w-4 h-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="poweruser" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                  <Zap className="w-4 h-4 mr-2" />
                  Debug
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="preview" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground" data-tour="export-tab">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-0">
            <ErrorBoundary>
              <CollectionTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="fx" className="mt-0">
            <ErrorBoundary>
              <FXBuilderTab />
            </ErrorBoundary>
          </TabsContent>

          {powerUserMode && (
            <>
              <TabsContent value="labs" className="mt-0">
                <ErrorBoundary>
                  <LabsTab />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="traitlibrary" className="mt-0">
                <ErrorBoundary>
                  <TraitLibraryTab />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="performance" className="mt-0">
                <ErrorBoundary>
                  <PerformanceTab />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="poweruser" className="mt-0">
                <ErrorBoundary>
                  <PowerUserPanel />
                </ErrorBoundary>
              </TabsContent>
            </>
          )}

          <TabsContent value="preview" className="mt-0">
            <ErrorBoundary>
              <PreviewTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ErrorBoundary>
              <ExportTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <ErrorBoundary>
              <SettingsTab />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
