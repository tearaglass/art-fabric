import { useNavigate } from 'react-router-dom';
import { ProjectHeader } from '@/components/ProjectHeader';
import { Button } from '@/components/ui/button';
import { Wand2, Zap, Box, Radio } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col w-full">
      <ProjectHeader />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 gradient-text">
            LaneyGen
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Multi-modal NFT & generative art collection builder
          </p>
          <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
            Create deterministic, exportable art collections powered by WebGL shaders, 
            P5.js sketches, Strudel patterns, and AI-generated imagery. 
            From generative traits to live performance—all in one workspace.
          </p>
          
          <Button 
            size="lg" 
            onClick={() => navigate('/workspace')}
            className="gradient-primary text-lg px-8 py-6 glow-primary hover:scale-105 transition-transform"
          >
            <Zap className="w-5 h-5 mr-2" />
            Launch Workspace
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Box className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Modal Traits</h3>
            <p className="text-sm text-muted-foreground">
              Combine images, shaders, P5.js, Strudel patterns, and AI-generated layers
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Wand2 className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">FX Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              Apply post-processing effects: glitch, bloom, distortion, and more
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Performance</h3>
            <p className="text-sm text-muted-foreground">
              VJ mode with BPM sync, transport controls, and OSC integration
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Deterministic Export</h3>
            <p className="text-sm text-muted-foreground">
              Export NFT collections, VDMX templates, ISF shaders, and MIDI files
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card/50 border border-border rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-4 gradient-text">About</h2>
            <div className="space-y-4 text-foreground/80">
              <p>
                <strong className="text-foreground">LaneyGen</strong> is a comprehensive toolkit for 
                creating generative art collections that blend traditional NFT trait systems with 
                cutting-edge creative coding, live performance, and AI generation.
              </p>
              <p>
                Unlike conventional generative art platforms, LaneyGen treats each token as a 
                multi-sensory composition—visual layers rendered through WebGL and P5.js, 
                audio patterns composed in Strudel, and AI-enhanced imagery—all governed by 
                a deterministic rules engine.
              </p>
              <p>
                Whether you're minting a 10k PFP collection, designing VDMX templates for 
                live shows, or exploring procedural audiovisual synthesis, LaneyGen provides 
                the creative infrastructure to make it happen.
              </p>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Built with React, TypeScript, WebGL2, P5.js, Strudel, and powered by Lovable Cloud.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
