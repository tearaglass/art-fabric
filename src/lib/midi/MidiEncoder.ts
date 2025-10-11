/**
 * Minimal MIDI File Encoder (SMF Type 0, 480 PPQ)
 */

export interface MidiNote {
  pitch: number; // MIDI note number (0-127)
  velocity: number; // 0-127
  start: number; // in ticks
  duration: number; // in ticks
}

export function encodeMidi(notes: MidiNote[], bpm: number): Uint8Array {
  const PPQ = 480; // ticks per quarter note
  const microsecondsPerQuarter = Math.floor(60000000 / bpm);

  // Helper to write variable-length quantity
  function writeVLQ(value: number): number[] {
    const result: number[] = [];
    let buffer = value & 0x7f;
    while ((value >>= 7) > 0) {
      result.push(buffer | 0x80);
      buffer = value & 0x7f;
    }
    result.push(buffer);
    return result.reverse();
  }

  // Build track events
  const events: number[] = [];

  // Tempo meta event (track 0, tick 0)
  events.push(...[0x00, 0xff, 0x51, 0x03]); // delta=0, meta, set tempo, length=3
  events.push((microsecondsPerQuarter >> 16) & 0xff);
  events.push((microsecondsPerQuarter >> 8) & 0xff);
  events.push(microsecondsPerQuarter & 0xff);

  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.start - b.start);

  // Track note-on/note-off events
  const noteEvents: Array<{ tick: number; type: 'on' | 'off'; pitch: number; velocity: number }> = [];
  sortedNotes.forEach((note) => {
    noteEvents.push({ tick: note.start, type: 'on', pitch: note.pitch, velocity: note.velocity });
    noteEvents.push({ tick: note.start + note.duration, type: 'off', pitch: note.pitch, velocity: 0 });
  });
  noteEvents.sort((a, b) => a.tick - b.tick);

  let lastTick = 0;
  noteEvents.forEach((evt) => {
    const delta = evt.tick - lastTick;
    events.push(...writeVLQ(delta));

    if (evt.type === 'on') {
      events.push(0x90, evt.pitch, evt.velocity); // Note On, channel 0
    } else {
      events.push(0x80, evt.pitch, 0); // Note Off
    }

    lastTick = evt.tick;
  });

  // End of track
  events.push(...[0x00, 0xff, 0x2f, 0x00]);

  // Build MIDI file
  const header = [
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // header length = 6
    0x00, 0x00, // format = 0 (single track)
    0x00, 0x01, // num tracks = 1
    (PPQ >> 8) & 0xff,
    PPQ & 0xff, // ticks per quarter
  ];

  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    (events.length >> 24) & 0xff,
    (events.length >> 16) & 0xff,
    (events.length >> 8) & 0xff,
    events.length & 0xff,
  ];

  return new Uint8Array([...header, ...trackHeader, ...events]);
}
