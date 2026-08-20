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

  it('formats Trackpoints with Time, AltitudeMeters, DistanceMeters, and HeartRateBpm', () => {
    const trackPoints: TrackPoint[] = [
      { timestamp: new Date('2026-08-07T10:00:00Z'), ele: 755.0, hr: 140, speed: 10.0 },
      { timestamp: new Date('2026-08-07T10:00:01Z'), ele: 755.35, hr: 145, speed: 10.0 },
    ];

    const tcx = exporter.export(trackPoints);

    expect(tcx).not.toContain('<Position>');
    expect(tcx).toContain('<AltitudeMeters>755.00</AltitudeMeters>');
    expect(tcx).toContain('<AltitudeMeters>755.35</AltitudeMeters>');
    expect(tcx).toContain('<DistanceMeters>0.0000</DistanceMeters>');
    expect(tcx).toContain('<DistanceMeters>2.7778</DistanceMeters>');
    expect(tcx).toContain('<Value>140</Value>');
  });

  it('escapes XML special characters in activity name', () => {
    const tcx = exporter.export([], 'Run <fast> & "hard"');
    expect(tcx).toContain('&lt;fast&gt;');
    expect(tcx).toContain('&amp;');
    expect(tcx).toContain('&quot;hard&quot;');
  });

  it('exports all possible widget metrics including Cadence, Power, and GPS into TCX', () => {
    const trackPoints: TrackPoint[] = [];
    const baseTime = new Date('2026-08-07T10:00:00Z').getTime();
    
    // Generate values for all possible widgets for 10 seconds
    for (let i = 0; i < 10; i++) {
      trackPoints.push({
        timestamp: new Date(baseTime + i * 1000),
        ele: 755.0 + (i * 0.5),
        hr: 140 + i,
        speed: 10.0 + (i * 0.1),
        inclination: 4.5,
        cadence: 90 + i,
        power: 200 + i,
        lat: 45.0 + (i * 0.0001),
        lng: 23.0 + (i * 0.0001),
      });
    }

    const tcx = exporter.export(trackPoints);

    // Verify Heart Rate
    expect(tcx).toContain('<Value>140</Value>');
    expect(tcx).toContain('<Value>149</Value>');

    // Verify Cadence
    expect(tcx).toContain('<Cadence>90</Cadence>');
    expect(tcx).toContain('<Cadence>99</Cadence>');
    
    // Verify Power (Watts in TPX extension)
    expect(tcx).toContain('<Extensions>');
    expect(tcx).toContain('<TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">');
    expect(tcx).toContain('<Watts>200</Watts>');
    expect(tcx).toContain('<Watts>209</Watts>');

    // Verify GPS Position
    expect(tcx).toContain('<Position>');
    expect(tcx).toContain('<LatitudeDegrees>45.000000</LatitudeDegrees>');
    expect(tcx).toContain('<LongitudeDegrees>23.000000</LongitudeDegrees>');
    expect(tcx).toContain('<LatitudeDegrees>45.000900</LatitudeDegrees>');
  });
});
