import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code2, Activity, FileJson, Terminal } from 'lucide-react';
import { useProjectStore } from '@/store/useProjectStore';
import { eventBus } from '@/lib/events/EventBus';
import { renderCache } from '@/lib/cache/RenderCache';

export const PowerUserPanel = () => {
  const projectState = useProjectStore();
  const [events, setEvents] = useState<any[]>([]);
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(0);
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, size: 0 });

  useEffect(() => {
    // Subscribe to all events
    const topics = [
      'render/started',
      'render/completed',
      'assets/added',
      'assets/removed',
      'project/saved',
      'rng/seedChanged',
    ];

    const unsubscribers = topics.map(topic =>
      eventBus.on(topic as any, (payload) => {
        setEvents(prev => [{
          topic,
          payload,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 100));
      })
    );

    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    const fpsInterval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      setFps(Math.round((frameCount / delta) * 1000));
      frameCount = 0;
      lastTime = now;
    }, 1000);

    const frameCounter = () => {
      frameCount++;
      requestAnimationFrame(frameCounter);
    };
    requestAnimationFrame(frameCounter);

    // Memory usage (if available)
    const memInterval = setInterval(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        setMemory(Math.round(mem.usedJSHeapSize / 1024 / 1024));
      }
    }, 2000);

    // Cache stats
    const cacheInterval = setInterval(async () => {
      const stats = await renderCache.getStats();
      setCacheStats(stats as any);
    }, 3000);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(fpsInterval);
      clearInterval(memInterval);
      clearInterval(cacheInterval);
    };
  }, []);

  return (
    <Card className="p-6 border-border bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold gradient-text">⚡ Power User Mode</h2>
        <div className="flex gap-2">
          <Badge variant="outline">FPS: {fps}</Badge>
          {memory > 0 && <Badge variant="outline">Memory: {memory}MB</Badge>}
          <Badge variant="outline">
            Cache: {cacheStats.hits}/{cacheStats.hits + cacheStats.misses} ({cacheStats.size})
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">
            <Activity className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="state">
            <FileJson className="w-4 h-4 mr-2" />
            State
          </TabsTrigger>
          <TabsTrigger value="console">
            <Terminal className="w-4 h-4 mr-2" />
            Console
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 className="w-4 h-4 mr-2" />
            Code Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <ScrollArea className="h-[400px] rounded border border-border bg-muted/30 p-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events yet. Interact with the app to see event stream.
              </p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {events.map((event, i) => (
                  <div key={i} className="border-l-2 border-primary/50 pl-3 py-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {event.topic}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-muted-foreground mt-1 overflow-x-auto">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="state" className="mt-4">
          <ScrollArea className="h-[400px] rounded border border-border bg-muted/30 p-4">
            <pre className="font-mono text-xs text-muted-foreground">
              {JSON.stringify(
                {
                  projectName: projectState.projectName,
                  seed: projectState.seed,
                  collectionSize: projectState.collectionSize,
                  traitClasses: projectState.traitClasses.length,
                  rules: projectState.rules.length,
                  fxConfigs: projectState.fxConfigs,
                  powerUserMode: projectState.powerUserMode
                },
                null,
                2
              )}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="console" className="mt-4">
          <ScrollArea className="h-[400px] rounded border border-border bg-muted/30 p-4">
            <div className="font-mono text-xs">
              <p className="text-primary">$ LaneyGen Debug Console</p>
              <p className="text-muted-foreground mt-2">
                Open browser DevTools for full console access.
              </p>
              <p className="text-muted-foreground mt-1">
                Available global commands:
              </p>
              <ul className="text-muted-foreground ml-4 mt-2 space-y-1">
                <li>• window.eventBus - Event bus instance</li>
                <li>• window.renderCache - Render cache utilities</li>
                <li>• window.exportProjectState() - Export full state</li>
              </ul>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <div className="rounded border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Monaco code editor coming soon. For now, use the tabs to edit:
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Code2 className="w-4 h-4 mr-2" />
                Shader Lab → Edit GLSL shaders
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Code2 className="w-4 h-4 mr-2" />
                P5 Lab → Edit p5.js sketches
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Code2 className="w-4 h-4 mr-2" />
                Strudel Lab → Edit audio patterns (Monaco enabled)
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
