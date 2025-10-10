import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileImage, GitBranch, BarChart3, Wand2, Play, Download } from 'lucide-react';
import { ProjectHeader } from './ProjectHeader';
import { AssetsTab } from './tabs/AssetsTab';
import { RulesTab } from './tabs/RulesTab';
import { DistributionTab } from './tabs/DistributionTab';
import { FXBuilderTab } from './tabs/FXBuilderTab';
import { PreviewTab } from './tabs/PreviewTab';
import { ExportTab } from './tabs/ExportTab';

interface LayoutProps {
  children?: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <ProjectHeader />
      
      <main className="flex-1 container mx-auto px-6 py-6">
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-card border border-border">
            <TabsTrigger value="assets" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <FileImage className="w-4 h-4 mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="rules" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <GitBranch className="w-4 h-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="distribution" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Distribution
            </TabsTrigger>
            <TabsTrigger value="fx" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Wand2 className="w-4 h-4 mr-2" />
              FX Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="mt-0">
            <AssetsTab />
          </TabsContent>

          <TabsContent value="rules" className="mt-0">
            <RulesTab />
          </TabsContent>

          <TabsContent value="distribution" className="mt-0">
            <DistributionTab />
          </TabsContent>

          <TabsContent value="fx" className="mt-0">
            <FXBuilderTab />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <PreviewTab />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ExportTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
