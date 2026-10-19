export type ContentCategory = "software" | "movie" | "ea" | "auto";

export interface EAContent {
  eaName: string;
  tagline: string;
  featuresSummary: string;
  htmlCode: string;
  imagePrompt: string;
  category?: "software" | "movie" | "ea";
  version?: string;
  systemRequirements?: string;
  genre?: string;
  movieCategory?: string;
  generatedImageUrl?: string;
  vercelUrl?: string;
  googleDriveUrl?: string;
  oneDriveUrl?: string;
}

export interface GoogleSheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export interface OneDriveInfo {
  name: string;
  url: string;
  type: "excel" | "csv" | "shared_link" | "file";
  rowCount?: number;
  lastSynced?: string;
}

export interface SheetRow {
  timestamp: string;
  name: string;
  category?: string;
  tagline: string;
  featuresSummary: string;
  htmlCode: string;
  imagePrompt: string;
  downloadUrl?: string;
}

