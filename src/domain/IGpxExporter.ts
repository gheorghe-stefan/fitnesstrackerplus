import { TrackPoint } from './models';

/**
 * Interface for exporting track points to GPX format.
 * Decoupled from recording logic to allow alternative exporters (TCX, FIT, etc.).
 */
export interface IGpxExporter {
  export(trackPoints: ReadonlyArray<TrackPoint>, activityName?: string): string;
}
