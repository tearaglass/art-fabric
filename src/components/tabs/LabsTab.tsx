import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Shapes, Music, Image } from 'lucide-react';
import { ShaderLabTab } from './ShaderLabTab';
import { P5LabTab } from './P5LabTab';
import { StrudelMinimalTab } from './StrudelMinimalTab';
import { SDLabTab } from './SDLabTab';

export function LabsTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">Creative Labs</h1>
          <p className="text-muted-foreground">
            Generate procedural art, shaders, music patterns, and AI images for your collection
          </p>
        </div>

        <Tabs defaultValue="shader" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="shader" className="gap-2" data-tour="shader-lab">
              <Sparkles className="w-4 h-4" />
              Shader Lab
            </TabsTrigger>
            <TabsTrigger value="p5" className="gap-2">
              <Shapes className="w-4 h-4" />
              p5.js Lab
            </TabsTrigger>
            <TabsTrigger value="strudel" className="gap-2" data-tour="strudel-lab">
              <Music className="w-4 h-4" />
              Strudel Lab
            </TabsTrigger>
            <TabsTrigger value="sd" className="gap-2">
              <Image className="w-4 h-4" />
              AI Image Lab
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shader" className="mt-0">
            <ShaderLabTab />
          </TabsContent>

          <TabsContent value="p5" className="mt-0">
            <P5LabTab />
          </TabsContent>

          <TabsContent value="strudel" className="mt-0">
            <StrudelMinimalTab />
          </TabsContent>

          <TabsContent value="sd" className="mt-0">
            <SDLabTab />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
