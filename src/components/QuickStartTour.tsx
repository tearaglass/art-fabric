import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface QuickStartTourProps {
  onComplete?: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: "Welcome to your Generative Art Studio! Let's take a quick tour of the key features.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="preview-canvas"]',
    content: "This is your generated artwork. Each piece is unique and created using WebGL shaders, P5.js sketches, and procedural audio.",
    placement: 'right',
  },
  {
    target: '[data-tour="randomize-button"]',
    content: "Click here to generate infinite variations. Each randomization creates a completely new piece based on your trait library.",
    placement: 'top',
  },
  {
    target: '[data-tour="shader-lab"]',
    content: "The Shader Lab lets you create custom WebGL backgrounds with live code editing and preset shaders.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="strudel-lab"]',
    content: "Compose generative music patterns here using Strudel's powerful live coding syntax.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="export-tab"]',
    content: "When you're ready, export your entire collection as images, audio files, or VDMX-compatible packages.",
    placement: 'bottom',
  },
];

export const QuickStartTour = ({ onComplete }: QuickStartTourProps) => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('quickstart-tour-completed');
    if (!hasSeenTour) {
      // Delay tour start to ensure elements are rendered
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      localStorage.setItem('quickstart-tour-completed', 'true');
      setRun(false);
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(185 100% 55%)',
          backgroundColor: 'hsl(220 20% 12%)',
          textColor: 'hsl(210 15% 95%)',
          arrowColor: 'hsl(220 20% 12%)',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '0.5rem',
        },
        buttonNext: {
          background: 'linear-gradient(135deg, hsl(185 100% 55%), hsl(280 70% 55%))',
          borderRadius: '0.375rem',
        },
        buttonBack: {
          color: 'hsl(210 10% 60%)',
        },
      }}
    />
  );
};
