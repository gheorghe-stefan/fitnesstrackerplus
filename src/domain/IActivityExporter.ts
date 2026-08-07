import { TrackPoint } from './models';

/**
 * Common interface for all activity file exporters (TCX, GPX, etc.).
 */
export interface IActivityExporter {
  /** File extension for exported file (e.g. 'tcx' or 'gpx') */
  readonly extension: string;

  /** MIME type for file blob creation */
  readonly mimeType: string;

  /**
   * Exports an array of TrackPoints to formatted XML string.
   *
   * @param trackPoints Array of recorded activity track points
   * @param activityName Optional custom activity name/title
   * @returns Formatted XML document string
   */
  export(trackPoints: ReadonlyArray<TrackPoint>, activityName?: string): string;
}
