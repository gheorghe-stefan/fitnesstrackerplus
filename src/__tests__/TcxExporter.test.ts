import { TcxExporter } from '../services/TcxExporter';
import { TrackPoint } from '../domain/models';

describe('TcxExporter', () => {
  let exporter: TcxExporter;

  beforeEach(() => {
    exporter = new TcxExporter();
  });

  it('has correct file extension and mime type', () => {
    expect(exporter.extension).toBe('tcx');
    expect(exporter.mimeType).toBe('application/vnd.garmin.tcx+xml');
  });

  it('generates valid TCX v2 XML root and Running activity', () => {
    const tcx = exporter.export([]);
    expect(tcx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(tcx).toContain('<TrainingCenterDatabase');
    expect(tcx).toContain('xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"');
    expect(tcx).toContain('<Activity Sport="Running">');
  });

  it('includes Powered by FitnessTracker+ in Notes tag', () => {
    const tcx = exporter.export([]);
    expect(tcx).toContain('<Notes>Powered by FitnessTracker+</Notes>');
  });

  it('includes activity name in Notes tag when provided', () => {
    const tcx = exporter.export([], 'Morning Treadmill Run');
    expect(tcx).toContain('<Notes>Morning Treadmill Run - Powered by FitnessTracker+</Notes>');
  });

  it('omits Position tag in default Pure Indoor Mode', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2026-08-07T10:00:00Z'), lat: 47.386254, lon: 9.518632, ele: 755.0, hr: 140, speed: 10.0 },
      { timestamp: new Date('2026-08-07T10:00:01Z'), lat: 47.386260, lon: 9.518640, ele: 755.35, hr: 145, speed: 10.0 },
    ];

    const tcx = exporter.export(trackPoints);

    expect(tcx).not.toContain('<Position>');
    expect(tcx).toContain('<AltitudeMeters>755.00</AltitudeMeters>');
    expect(tcx).toContain('<AltitudeMeters>755.35</AltitudeMeters>');
    expect(tcx).toContain('<DistanceMeters>0.0000</DistanceMeters>');
    expect(tcx).toContain('<DistanceMeters>2.7778</DistanceMeters>');
    expect(tcx).toContain('<Value>140</Value>');
  });

  it('renders Position tag when includeGpsPosition is true', () => {
    const gpsExporter = new TcxExporter(true);
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2026-08-07T10:00:00Z'), lat: 47.386254, lon: 9.518632, ele: 755.0, hr: 140, speed: 10.0 },
    ];

    const tcx = gpsExporter.export(trackPoints);

    expect(tcx).toContain('<Position>');
    expect(tcx).toContain('<LatitudeDegrees>47.386254</LatitudeDegrees>');
    expect(tcx).toContain('<LongitudeDegrees>9.518632</LongitudeDegrees>');
  });

  it('escapes XML special characters in activity name', () => {
    const tcx = exporter.export([], 'Run <fast> & "hard"');
    expect(tcx).toContain('&lt;fast&gt;');
    expect(tcx).toContain('&amp;');
    expect(tcx).toContain('&quot;hard&quot;');
  });
});
