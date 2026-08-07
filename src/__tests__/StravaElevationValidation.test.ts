import fs from 'fs';
import path from 'path';
import { TcxExporter } from '../services/TcxExporter';
import { SportstechF37sProfile } from '../sensors/bluetooth/TreadmillProfiles';
import { TrackPoint } from '../domain/models';

export interface WorkoutSegment {
  durationSeconds: number;
  speedKmH: number;
  inclineLevel: number;
}

export interface ParameterizedWorkoutTestCase {
  name: string;
  baseFilename: string;
  segments: WorkoutSegment[];
  expectedTotalDistanceMeters: number;
  expectedElevationGainMeters: number;
}

function runParameterizedTcxTest(testCase: ParameterizedWorkoutTestCase, index: number) {
  const tcxExporter = new TcxExporter();

  // Generate unique dynamic start timestamp (staggered by test index so Strava accepts uploads as new activities)
  const nowMs = Date.now();
  const startTime = new Date(nowMs - (index + 1) * 3600000);

  const trackPoints: TrackPoint[] = [];
  let currentSecond = 0;
  let totalCalculatedDistance = 0;
  let currentElevationMeters = 755.0;

  // Add initial point at t=0s
  trackPoints.push({
    timestamp: new Date(startTime.getTime()),
    hr: 120,
    speed: 0,
    inclination: 4.5,
    ele: currentElevationMeters,
  });

  for (const seg of testCase.segments) {
    const inclinePercent = SportstechF37sProfile.parseIncline(seg.inclineLevel * 5).inclinationPercent;

    for (let s = 1; s <= seg.durationSeconds; s++) {
      if (totalCalculatedDistance >= testCase.expectedTotalDistanceMeters) {
        break;
      }

      currentSecond++;
      const timestamp = new Date(startTime.getTime() + currentSecond * 1000);

      // Realistic human micro-speed fluctuation (±0.1 km/h around target speed)
      // Gives Strava a natural Y-axis scale (4:58..5:02/km) preventing zero-variance grid snapping
      const realisticSpeed = seg.speedKmH + Math.sin(s * 0.1) * 0.1;

      const stepDistance = (realisticSpeed / 3.6) * 1;
      totalCalculatedDistance += stepDistance;

      const stepElevationGainMeters = stepDistance * (inclinePercent / 100);
      currentElevationMeters += stepElevationGainMeters;

      trackPoints.push({
        timestamp,
        hr: 145,
        speed: Number(realisticSpeed.toFixed(2)),
        inclination: inclinePercent,
        ele: Number(currentElevationMeters.toFixed(2)),
      });
    }
  }

  const startEle = trackPoints[0].ele!;
  const endEle = trackPoints[trackPoints.length - 1].ele!;
  const actualGain = Number((endEle - startEle).toFixed(1));
  const actualDistance = Number(totalCalculatedDistance.toFixed(1));

  // Validate math (within 1 meter)
  expect(actualDistance).toBeCloseTo(testCase.expectedTotalDistanceMeters, 0);
  expect(actualGain).toBeCloseTo(testCase.expectedElevationGainMeters, 0);

  // Export TCX XML
  const tcxXml = tcxExporter.export(trackPoints, testCase.name);
  expect(tcxXml).toContain('<Activity Sport="Running">');
  expect(tcxXml).toContain('<Notes>');
  expect(tcxXml).toContain('Powered by FitnessTracker+</Notes>');
  expect(tcxXml).toContain('<DistanceMeters>');
  expect(tcxXml).toContain('<AltitudeMeters>');
  expect(tcxXml).toContain('<HeartRateBpm>');

  // Write TCX file to src/__tests__/gen directory for manual Strava upload testing
  const genDir = path.join(__dirname, 'gen');
  if (!fs.existsSync(genDir)) {
    fs.mkdirSync(genDir, { recursive: true });
  }

  const tcxPath = path.join(genDir, `${testCase.baseFilename}.tcx`);
  fs.writeFileSync(tcxPath, tcxXml, 'utf-8');

  return { actualDistance, actualGain, tcxPath };
}

describe('Parameterized Strava Elevation TCX Test Suite', () => {
  const testCases: ParameterizedWorkoutTestCase[] = [
    {
      name: '1000m Hill Climb (Level 15 / 10.5%)',
      baseFilename: '1000m_105m_elevation_test',
      segments: [
        // 300s @ 12.0 km/h = 1000m distance. Level 15 = 10.5% grade. Gain = 105m.
        { durationSeconds: 300, speedKmH: 12.0, inclineLevel: 15 },
      ],
      expectedTotalDistanceMeters: 1000.0,
      expectedElevationGainMeters: 105.0,
    },
    {
      name: 'Multi-Segment Hill Intervals (500m flat + 1000m 9.0% + 300m 7.5%)',
      baseFilename: 'multi_segment_interval_elevation_test',
      segments: [
        // Seg 1: 180s @ 10.0 km/h (500m) @ Level 0 (4.5%) -> gain = 500 * 0.045 = 22.5m
        { durationSeconds: 180, speedKmH: 10.0, inclineLevel: 0 },
        // Seg 2: 300s @ 12.0 km/h (1000m) @ Level 10 (9.0%) -> gain = 1000 * 0.090 = 90.0m
        { durationSeconds: 300, speedKmH: 12.0, inclineLevel: 10 },
        // Seg 3: 120s @ 9.0 km/h (300m) @ Level 5 (7.5%) -> gain = 300 * 0.075 = 22.5m
        { durationSeconds: 120, speedKmH: 9.0, inclineLevel: 5 },
      ],
      expectedTotalDistanceMeters: 1800.0,
      expectedElevationGainMeters: 135.0,
    },
    {
      name: '5000m Steady Tempo (Level 2 / 6.6%)',
      baseFilename: '5000m_steady_tempo_elevation_test',
      segments: [
        // 1500s (25 mins) @ 12.0 km/h = 5000m. Level 2 = 6.6% grade. Gain = 5000 * 0.066 = 330.0m
        { durationSeconds: 1500, speedKmH: 12.0, inclineLevel: 2 },
      ],
      expectedTotalDistanceMeters: 5000.0,
      expectedElevationGainMeters: 330.0,
    },
  ];

  testCases.forEach((testCase, index) => {
    it(`validates and exports TCX: ${testCase.name}`, () => {
      const { actualDistance, actualGain, tcxPath } = runParameterizedTcxTest(testCase, index);
      expect(fs.existsSync(tcxPath)).toBe(true);
      expect(actualDistance).toBeGreaterThan(0);
      expect(actualGain).toBeGreaterThan(0);
    });
  });
});
