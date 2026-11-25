import 'server-only';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CONTACT } from '@/content/data';

/** The résumé link is only rendered once the PDF actually exists in /public. */
export const RESUME_AVAILABLE = existsSync(join(process.cwd(), 'public', CONTACT.resume));
