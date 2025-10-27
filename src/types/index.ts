export interface SavedTrack {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  mood: string;
  generatedAt: string;
  duration: number;
  isFavorite?: boolean;
}

export interface TrackHistory {
  tracks: SavedTrack[];
}

