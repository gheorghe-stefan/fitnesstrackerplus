import { IActivityExporter } from '../domain/IActivityExporter';
import { TrackPoint } from '../domain/models';

/**
 * Exports track points to Garmin Training Center XML (TCX v2) format.
 * Features:
 * - <Notes>Powered by FitnessTracker+</Notes> for automatic Strava activity description
 * - Explicit <DistanceMeters> on every trackpoint for 1000% exact Strava distance matching
 * - Native <AltitudeMeters> for elevation gain
 * - Native <HeartRateBpm> for heart rate telemetry
 */
export class TcxExporter implements IActivityExporter {
  public readonly extension = 'tcx';
  public readonly mimeType = 'application/vnd.garmin.tcx+xml';

  /**
   * @param includeGpsPosition Whether to render GPS <Position> tags.
   * Defaults to false (Pure Indoor Mode) so Strava reads exact treadmill <AltitudeMeters>
   * without applying DEM map-matching overrides or 0m sea level clipping.
   */
  constructor(private readonly includeGpsPosition: boolean = false) {}

  export(trackPoints: ReadonlyArray<TrackPoint>, activityName?: string): string {
    const startTime = trackPoints.length > 0
      ? trackPoints[0].timestamp.toISOString()
      : new Date().toISOString();

    let totalTimeSeconds = 0;
    let totalDistanceMeters = 0;

    if (trackPoints.length > 1) {
      const startMs = trackPoints[0].timestamp.getTime();
      const endMs = trackPoints[trackPoints.length - 1].timestamp.getTime();
      totalTimeSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
    }

    // Compute cumulative distance along trackpoints
    let cumulativeDistanceMeters = 0;
    const formattedTrackpoints: string[] = [];

    for (let i = 0; i < trackPoints.length; i++) {
      const tp = trackPoints[i];

      if (i > 0) {
        const dtSec = (tp.timestamp.getTime() - trackPoints[i - 1].timestamp.getTime()) / 1000;
        if (dtSec > 0 && tp.speed && tp.speed > 0) {
          cumulativeDistanceMeters += (tp.speed / 3.6) * dtSec;
        }
      }

      formattedTrackpoints.push(this.formatTrackpoint(tp, cumulativeDistanceMeters));
    }

    const totalDistanceMetersStr = cumulativeDistanceMeters.toFixed(2);

    const notesContent = activityName && activityName.trim().length > 0
      ? `${activityName} - Powered by FitnessTracker+`
      : 'Powered by FitnessTracker+';

    return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
    <Activity Sport="Running">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${totalTimeSeconds}</TotalTimeSeconds>
        <DistanceMeters>${totalDistanceMetersStr}</DistanceMeters>
        <Calories>0</Calories>
        <Intensity>Active</Intensity>
        <Notes>${this.escapeXml(notesContent)}</Notes>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${formattedTrackpoints.join('\n')}
        </Track>
      </Lap>
      <Notes>${this.escapeXml(notesContent)}</Notes>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
  }

  private formatTrackpoint(tp: TrackPoint, cumulativeDistanceMeters: number): string {
    const ele = tp.ele !== undefined ? tp.ele.toFixed(2) : '0.00';
    const dist = cumulativeDistanceMeters.toFixed(4);

    const positionBlock = (this.includeGpsPosition && tp.lat !== undefined && tp.lon !== undefined)
      ? `
            <Position>
              <LatitudeDegrees>${tp.lat}</LatitudeDegrees>
              <LongitudeDegrees>${tp.lon}</LongitudeDegrees>
            </Position>`
      : '';

    const hrBlock = tp.hr !== undefined ? `
            <HeartRateBpm>
              <Value>${Math.round(tp.hr)}</Value>
            </HeartRateBpm>` : '';

    return `          <Trackpoint>
            <Time>${tp.timestamp.toISOString()}</Time>${positionBlock}
            <AltitudeMeters>${ele}</AltitudeMeters>
            <DistanceMeters>${dist}</DistanceMeters>${hrBlock}
          </Trackpoint>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
