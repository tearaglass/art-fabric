import { useProjectStore } from '@/store/useProjectStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WaveShape, FilterType, LFOShape, ModSource, ModDest, ChordType } from '@/types/Patch';
import { Volume2, Sliders, Radio, Grid3x3, Sparkles, Settings2 } from 'lucide-react';

export function SynthPanel() {
  const { currentPatch, updatePatch } = useProjectStore();

  const updateField = (field: string, value: any) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      updatePatch({ [field]: value } as any);
    } else if (keys.length === 2) {
      const parentKey = keys[0] as keyof typeof currentPatch;
      const parent = currentPatch[parentKey];
      if (typeof parent === 'object' && parent !== null) {
        updatePatch({ [parentKey]: { ...parent, [keys[1]]: value } } as any);
      }
    }
  };

  const updateStep = (idx: number, field: string, value: any) => {
    const newSteps = [...currentPatch.steps];
    newSteps[idx] = { ...newSteps[idx], [field]: value };
    updatePatch({ steps: newSteps });
  };

  const addRoute = () => {
    updatePatch({
      routes: [...currentPatch.routes, { src: 'LFO1', dst: 'cutoff', amt: 0.5 }]
    });
  };

  const removeRoute = (idx: number) => {
    updatePatch({ routes: currentPatch.routes.filter((_, i) => i !== idx) });
  };

  const updateRoute = (idx: number, field: string, value: any) => {
    const newRoutes = [...currentPatch.routes];
    newRoutes[idx] = { ...newRoutes[idx], [field]: value };
    updatePatch({ routes: newRoutes });
  };

  return (
    <Card className="p-6 border-border bg-card">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Synth Patch</h2>
      </div>

      <Accordion type="multiple" defaultValue={['osc', 'filter']} className="space-y-2">
        {/* Global */}
        <AccordionItem value="global" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span className="font-semibold">Global</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>BPM</Label>
                <Input
                  type="number"
                  value={currentPatch.bpm}
                  onChange={(e) => updateField('bpm', parseInt(e.target.value) || 120)}
                  className="font-mono"
                />
              </div>
              <div>
                <Label>Octave</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={currentPatch.octave}
                  onChange={(e) => updateField('octave', parseInt(e.target.value) || 3)}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Root</Label>
                <Select value={currentPatch.scale.root} onValueChange={(v) => updateField('scale.root', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'].map((n) => (
                      <SelectItem key={n} value={n}>{n.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mode</Label>
                <Select value={currentPatch.scale.mode} onValueChange={(v) => updateField('scale.mode', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'ionian', 'harmonic minor', 'melodic minor'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Oscillators */}
        <AccordionItem value="osc" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="font-semibold">Oscillators</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* OSC 1 */}
            <div className="space-y-3 p-3 rounded bg-muted/30">
              <Label className="text-xs font-semibold text-primary">OSC 1</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Wave</Label>
                  <Select value={currentPatch.osc1.wave} onValueChange={(v) => updateField('osc1.wave', v as WaveShape)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['sine', 'saw', 'square', 'noise'].map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Detune</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={currentPatch.osc1.detune}
                    onChange={(e) => updateField('osc1.detune', parseFloat(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Gain</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={currentPatch.osc1.gain}
                    onChange={(e) => updateField('osc1.gain', parseFloat(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* OSC 2 */}
            <div className="space-y-3 p-3 rounded bg-muted/30">
              <Label className="text-xs font-semibold text-secondary">OSC 2</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Wave</Label>
                  <Select value={currentPatch.osc2.wave} onValueChange={(v) => updateField('osc2.wave', v as WaveShape)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['sine', 'saw', 'square', 'noise'].map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Detune</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={currentPatch.osc2.detune}
                    onChange={(e) => updateField('osc2.detune', parseFloat(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Gain</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={currentPatch.osc2.gain}
                    onChange={(e) => updateField('osc2.gain', parseFloat(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Sub</Label>
                <Slider
                  value={[currentPatch.subGain]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('subGain', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Noise</Label>
                <Slider
                  value={[currentPatch.noiseGain]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('noiseGain', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Mix</Label>
                <Slider
                  value={[currentPatch.wavemix]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('wavemix', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Glide</Label>
                <Input
                  type="number"
                  step={0.001}
                  min={0}
                  max={1}
                  value={currentPatch.glide}
                  onChange={(e) => updateField('glide', parseFloat(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Filter */}
        <AccordionItem value="filter" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span className="font-semibold">Filter & Envelopes</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={currentPatch.ftype} onValueChange={(v) => updateField('ftype', v as FilterType)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['lp', 'bp', 'hp'].map((t) => (
                      <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cutoff</Label>
                <Input
                  type="number"
                  min={100}
                  max={5000}
                  value={currentPatch.cutoff}
                  onChange={(e) => updateField('cutoff', parseFloat(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Reso</Label>
                <Slider
                  value={[currentPatch.reso]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('reso', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Drive</Label>
                <Slider
                  value={[currentPatch.drive]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('drive', v)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Amp ADSR</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['a', 'd', 's', 'r'] as const).map((k) => (
                  <div key={k}>
                    <Label className="text-xs uppercase">{k}</Label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={2}
                      value={currentPatch.amp[k]}
                      onChange={(e) => updateField(`amp.${k}`, parseFloat(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Filter Env ADSR + Amt</Label>
              <div className="grid grid-cols-5 gap-2">
                {(['a', 'd', 's', 'r'] as const).map((k) => (
                  <div key={k}>
                    <Label className="text-xs uppercase">{k}</Label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={2}
                      value={currentPatch.filtenv[k]}
                      onChange={(e) => updateField(`filtenv.${k}`, parseFloat(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                ))}
                <div>
                  <Label className="text-xs">Amt</Label>
                  <Slider
                    value={[currentPatch.filtenv.amt]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => updateField('filtenv.amt', v)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LFOs & Routes */}
        <AccordionItem value="lfos" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span className="font-semibold">LFOs & Mod Matrix</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* LFO 1 */}
            <div className="space-y-2 p-3 rounded bg-muted/30">
              <Label className="text-xs font-semibold text-primary">LFO 1</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Shape</Label>
                  <Select value={currentPatch.lfo1.shape} onValueChange={(v) => updateField('lfo1.shape', v as LFOShape)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['sine', 'tri', 'saw', 'square'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Rate</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0.01}
                    max={10}
                    value={currentPatch.lfo1.rate}
                    onChange={(e) => updateField('lfo1.rate', parseFloat(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phase</Label>
                  <Slider
                    value={[currentPatch.lfo1.phase]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => updateField('lfo1.phase', v)}
                  />
                </div>
              </div>
            </div>

            {/* LFO 2 */}
            <div className="space-y-2 p-3 rounded bg-muted/30">
              <Label className="text-xs font-semibold text-secondary">LFO 2</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Shape</Label>
                  <Select value={currentPatch.lfo2.shape} onValueChange={(v) => updateField('lfo2.shape', v as LFOShape)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['sine', 'tri', 'saw', 'square'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Rate</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0.01}
                    max={10}
                    value={currentPatch.lfo2.rate}
                    onChange={(e) => updateField('lfo2.rate', parseFloat(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phase</Label>
                  <Slider
                    value={[currentPatch.lfo2.phase]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => updateField('lfo2.phase', v)}
                  />
                </div>
              </div>
            </div>

            {/* Mod Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Mod Routes</Label>
                <Button size="sm" variant="outline" onClick={addRoute} className="h-6 text-xs">
                  + Add
                </Button>
              </div>
              {currentPatch.routes.map((route, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                  <Select value={route.src} onValueChange={(v) => updateRoute(idx, 'src', v as ModSource)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['LFO1', 'LFO2', 'EnvF'].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={route.dst} onValueChange={(v) => updateRoute(idx, 'dst', v as ModDest)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['cutoff', 'reso', 'pan', 'pitch', 'gain', 'wavemix'].map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step={0.1}
                    min={-1}
                    max={1}
                    value={route.amt}
                    onChange={(e) => updateRoute(idx, 'amt', parseFloat(e.target.value))}
                    className="h-7 text-xs font-mono"
                  />
                  <Button size="sm" variant="destructive" onClick={() => removeRoute(idx)} className="h-7 text-xs">
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sequencer */}
        <AccordionItem value="seq" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" />
              <span className="font-semibold">16-Step Sequencer</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-8 gap-1">
              {currentPatch.steps.map((step, i) => (
                <div key={i} className="space-y-1">
                  <Button
                    size="sm"
                    variant={step.on ? 'default' : 'outline'}
                    className={`w-full h-8 text-xs ${step.on ? 'bg-primary' : ''}`}
                    onClick={() => updateStep(i, 'on', !step.on)}
                  >
                    {i + 1}
                  </Button>
                  {step.on && (
                    <>
                      <div className="h-12 bg-muted rounded relative overflow-hidden">
                        <div
                          className="absolute bottom-0 w-full bg-primary/50"
                          style={{ height: `${step.vel * 100}%` }}
                        />
                      </div>
                      <Input
                        type="number"
                        min={1}
                        max={4}
                        value={step.ratchets}
                        onChange={(e) => updateStep(i, 'ratchets', parseInt(e.target.value) || 1)}
                        className="h-6 text-xs font-mono text-center"
                        title="Ratchets"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Density</Label>
                <Slider
                  value={[currentPatch.density]}
                  min={0.25}
                  max={4}
                  step={0.25}
                  onValueChange={([v]) => updateField('density', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Swing</Label>
                <Slider
                  value={[currentPatch.swing]}
                  min={0.5}
                  max={0.65}
                  step={0.01}
                  onValueChange={([v]) => updateField('swing', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Chord</Label>
                <Select value={currentPatch.chord} onValueChange={(v) => updateField('chord', v as ChordType)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['triad', 'sus2', 'sus4', '7', 'm7', 'maj7', '9', 'm9', 'add9', '6', 'm6'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* FX */}
        <AccordionItem value="fx" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Effects</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Delay</Label>
                <Slider
                  value={[currentPatch.fx.delay]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('fx.delay', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Room</Label>
                <Slider
                  value={[currentPatch.fx.room]}
                  min={0}
                  max={0.7}
                  step={0.01}
                  onValueChange={([v]) => updateField('fx.room', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Crush</Label>
                <Slider
                  value={[currentPatch.fx.crush]}
                  min={0}
                  max={0.6}
                  step={0.01}
                  onValueChange={([v]) => updateField('fx.crush', v)}
                />
              </div>
              <div>
                <Label className="text-xs">Chorus</Label>
                <Slider
                  value={[currentPatch.fx.chorus]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField('fx.chorus', v)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Macros */}
        <AccordionItem value="macros" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span className="font-semibold">Macros (XY Pad)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-4">
            {(['Tone', 'Movement', 'Space', 'Grit'] as const).map((k) => (
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs font-semibold">{k}</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {currentPatch.macros[k].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[currentPatch.macros[k]]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => updateField(`macros.${k}`, v)}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
