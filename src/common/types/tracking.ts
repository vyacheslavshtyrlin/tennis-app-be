export interface TrackingCourt {
  width: number;
  height: number;
}

export interface TrackingBall {
  x: number;
  y: number;
}

export interface TrackingTimelineEntry {
  t: number;
  b: TrackingBall;
}

export interface TrackingData {
  court: TrackingCourt;
  timeline: TrackingTimelineEntry[];
}
