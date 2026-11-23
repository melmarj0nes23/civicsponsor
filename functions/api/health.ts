import { jsonResponse } from '../_lib/firestore.ts';

export async function onRequestGet(): Promise<Response> {
  return jsonResponse({ status: 'ok', runtime: 'cloudflare-pages' });
}
