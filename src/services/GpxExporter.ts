import { IGpxExporter } from '../domain/IGpxExporter';
import { TrackPoint } from '../domain/models';

/**
 * Exports track points to GPX 1.1 XML format.
 * Supports HR and speed data via Garmin TrackPointExtension/v1.
 */
export class GpxExporter implements IGpxExporter {
  public readonly extension = 'gpx';
  public readonly mimeType = 'application/gpx+xml';

  export(trackPoints: ReadonlyArray<TrackPoint>, activityName?: string): string {
    const name = activityName ?? `Activity ${new Date().toISOString().slice(0, 10)}`;
    const time = trackPoints.length > 0
      ? trackPoints[0].timestamp.toISOString()
      : new Date().toISOString();

    const trkpts = trackPoints.map(tp => this.formatTrackPoint(tp)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
     version="1.1"
     creator="FitnessTrackerPlus">
  <metadata>
    <name>${this.escapeXml(name)}</name>
    <desc>Powered by FitnessTracker+</desc>
    <time>${time}</time>
  </metadata>
  <trk>
    <name>${this.escapeXml(name)}</name>
    <desc>Powered by FitnessTracker+</desc>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
  }

  private formatTrackPoint(tp: TrackPoint): string {
    const lat = tp.lat ?? 0;
    const lon = tp.lon ?? 0;
    const eleTag = tp.ele !== undefined ? `\n        <ele>${tp.ele}</ele>` : '';
    const extensions = this.formatExtensions(tp);

    return `      <trkpt lat="${lat}" lon="${lon}">${eleTag}
        <time>${tp.timestamp.toISOString()}</time>${extensions}
      </trkpt>`;
  }

  private formatExtensions(tp: TrackPoint): string {
    const extensionFields: string[] = [];

    if (tp.hr !== undefined) {
      extensionFields.push(`            <gpxtpx:hr>${tp.hr}</gpxtpx:hr>`);
    }

    if (extensionFields.length === 0) return '';

    return `
        <extensions>
          <gpxtpx:TrackPointExtension>
${extensionFields.join('\n')}
          </gpxtpx:TrackPointExtension>
        </extensions>`;
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
