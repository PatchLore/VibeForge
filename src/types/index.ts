export interface SavedTrack {
  id: string;
  audioUrl: string;
  mood: string;
  generatedAt: string;
  duration: number;
  isFavorite?: boolean;
}

export interface TrackHistory {
  tracks: SavedTrack[];
}

