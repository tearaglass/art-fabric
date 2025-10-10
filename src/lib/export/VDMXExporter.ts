import { TraitClass } from '@/store/useProjectStore';
import { ShaderPreset } from '@/lib/shaders/presets';

export interface VDMXLayer {
  name: string;
  sourcePath: string;
  blendMode: string;
  opacity: number;
}

export interface VDMXTemplate {
  projectName: string;
  layers: VDMXLayer[];
  oscMappings: { address: string; target: string }[];
  colorPalette: string[];
}

/**
 * Generates VDMX project template (.vdmx XML file)
 */
export class VDMXExporter {
  static generateTemplate(
    projectName: string,
    traitClasses: TraitClass[],
    shaderPresets?: ShaderPreset[]
  ): string {
    const layers: VDMXLayer[] = [];
    const oscMappings: { address: string; target: string }[] = [];

    // Create layers for each trait class
    traitClasses.forEach((traitClass, index) => {
      layers.push({
        name: traitClass.name,
        sourcePath: `./clips/${traitClass.name}/`,
        blendMode: 'Normal',
        opacity: 1.0,
      });

      // Add OSC mapping for layer opacity
      oscMappings.push({
        address: `/layer/${index + 1}/opacity`,
        target: `Layer ${index + 1} Opacity`,
      });
    });

    // Add shader layers if provided
    if (shaderPresets) {
      shaderPresets.forEach((preset, index) => {
        layers.push({
          name: `Shader: ${preset.name}`,
          sourcePath: `./shaders/${preset.id}.fs`,
          blendMode: preset.category === 'overlay' ? 'Screen' : 'Normal',
          opacity: preset.category === 'overlay' ? 0.5 : 1.0,
        });

        // Add OSC mappings for shader parameters
        Object.keys(preset.uniforms).forEach((uniformName) => {
          oscMappings.push({
            address: `/shader/${preset.id}/${uniformName}`,
            target: `Shader ${preset.name} - ${uniformName}`,
          });
        });
      });
    }

    // Generate XML (simplified structure)
    return this.generateVDMXXML(projectName, layers, oscMappings);
  }

  private static generateVDMXXML(
    projectName: string,
    layers: VDMXLayer[],
    oscMappings: { address: string; target: string }[]
  ): string {
    const layersXML = layers
      .map(
        (layer, index) => `
    <layer index="${index}" name="${layer.name}">
      <source path="${layer.sourcePath}" />
      <blendMode>${layer.blendMode}</blendMode>
      <opacity>${layer.opacity}</opacity>
    </layer>`
      )
      .join('');

    const oscXML = oscMappings
      .map(
        (mapping) => `
    <mapping>
      <address>${mapping.address}</address>
      <target>${mapping.target}</target>
    </mapping>`
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<vdmx version="5.0">
  <project name="${projectName}">
    <metadata>
      <generator>LaneyGen</generator>
      <created>${new Date().toISOString()}</created>
    </metadata>
    
    <composition>
      <layers>${layersXML}
      </layers>
    </composition>
    
    <osc>
      <enabled>true</enabled>
      <port>8000</port>
      <mappings>${oscXML}
      </mappings>
    </osc>
    
    <settings>
      <resolution width="1920" height="1080" />
      <framerate>60</framerate>
      <colorSpace>sRGB</colorSpace>
    </settings>
  </project>
</vdmx>`;
  }

  static exportAsFile(template: string, filename: string): Blob {
    return new Blob([template], { type: 'application/xml' });
  }

  static downloadTemplate(
    projectName: string,
    traitClasses: TraitClass[],
    shaderPresets?: ShaderPreset[]
  ) {
    const xml = this.generateTemplate(projectName, traitClasses, shaderPresets);
    const blob = this.exportAsFile(xml, `${projectName}.vdmx`);
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}.vdmx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
