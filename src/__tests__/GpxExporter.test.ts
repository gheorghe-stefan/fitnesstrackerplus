import { GpxExporter } from '../services/GpxExporter';
import { TrackPoint } from '../domain/models';

describe('GpxExporter', () => {
  let exporter: GpxExporter;

  beforeEach(() => {
    exporter = new GpxExporter();
  });

  it('should generate valid GPX 1.1 XML header', () => {
    const gpx = exporter.export([]);
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('version="1.1"');
    expect(gpx).toContain('creator="FitnessTrackerPlus"');
  });

  it('should include gpxtpx namespace', () => {
    const gpx = exporter.export([]);
    expect(gpx).toContain('xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"');
  });

  it('should use provided activity name', () => {
    const gpx = exporter.export([], 'Morning Run');
    expect(gpx).toContain('<name>Morning Run</name>');
    expect(gpx).toContain('<desc>Powered by FitnessTracker+</desc>');
  });

  it('should generate default activity name when not provided', () => {
    const gpx = exporter.export([]);
    expect(gpx).toContain('<name>Activity ');
  });

  it('should format track points with HR extensions', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2025-01-01T10:00:00Z'), hr: 72 },
    ];
    const gpx = exporter.export(trackPoints);
    expect(gpx).toContain('<trkpt lat="0" lon="0">');
    expect(gpx).toContain('<time>2025-01-01T10:00:00.000Z</time>');
    expect(gpx).toContain('<gpxtpx:hr>72</gpxtpx:hr>');
  });

  it('should handle multiple track points', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2025-01-01T10:00:00Z'), hr: 70 },
      { timestamp: new Date('2025-01-01T10:00:01Z'), hr: 72 },
      { timestamp: new Date('2025-01-01T10:00:02Z'), hr: 75 },
    ];
    const gpx = exporter.export(trackPoints);
    const matches = gpx.match(/<trkpt/g);
    expect(matches).toHaveLength(3);
  });

  it('should handle track points without HR', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2025-01-01T10:00:00Z') },
    ];
    const gpx = exporter.export(trackPoints);
    expect(gpx).not.toContain('<extensions>');
    expect(gpx).toContain('<trkpt');
  });

  it('should handle empty track points array', () => {
    const gpx = exporter.export([]);
    expect(gpx).toContain('<trkseg>');
    expect(gpx).toContain('</trkseg>');
    expect(gpx).not.toContain('<trkpt');
  });

  it('should escape XML special characters in activity name', () => {
    const gpx = exporter.export([], 'Run <morning> & "fast"');
    expect(gpx).toContain('&lt;morning&gt;');
    expect(gpx).toContain('&amp;');
    expect(gpx).toContain('&quot;fast&quot;');
  });

  it('should include elevation when provided', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2025-01-01T10:00:00Z'), hr: 120, ele: 755.5 },
    ];
    const gpx = exporter.export(trackPoints);
    expect(gpx).toContain('<gpxtpx:hr>120</gpxtpx:hr>');
    expect(gpx).toContain('<ele>755.5</ele>');
    expect(gpx).not.toContain('<gpxtpx:speed>');
  });

  it('should use first track point timestamp for metadata time', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2025-06-15T08:30:00Z'), hr: 65 },
      { timestamp: new Date('2025-06-15T08:30:01Z'), hr: 67 },
    ];
    const gpx = exporter.export(trackPoints);
    // The metadata <time> should be the first track point's timestamp
    expect(gpx).toContain('<time>2025-06-15T08:30:00.000Z</time>');
  });
});
