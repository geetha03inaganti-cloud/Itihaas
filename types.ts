
export type Language = 'en' | 'te' | 'hi';

export interface Poet {
  name: string;
  period: string;
  language: string;
  contribution: string;
  famousVerse: string;
  source: string;
}

export interface HeritageContent {
  overview: string;
  architecture: string;
  monuments: string;
  traditions: string;
  cuisine: string;
  artCrafts: string;
  literature: string;
  agriculture: string;
  lifestyle: string;
  poets: Poet[];
}

export interface WikiImage {
  url: string;
  caption: string;
}

export interface PlaceDetails {
  id: string;
  name: string;
  coords?: { lat: number; lng: number };
  content?: HeritageContent;
  images: WikiImage[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
