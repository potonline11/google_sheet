export interface EAContent {
  eaName: string;
  tagline: string;
  featuresSummary: string;
  htmlCode: string;
  imagePrompt: string;
  generatedImageUrl?: string;
  vercelUrl?: string;
  googleDriveUrl?: string;
}

export interface GoogleSheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export interface SheetRow {
  timestamp: string;
  eaName: string;
  tagline: string;
  featuresSummary: string;
  htmlCode: string;
  imagePrompt: string;
}
