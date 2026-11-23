export interface PagesEnv {
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_DATABASE_ID?: string;
  FIREBASE_API_KEY?: string;
}

export interface PagesContext<P extends Record<string, string> = Record<string, string>> {
  request: Request;
  env: PagesEnv;
  params: P;
}
