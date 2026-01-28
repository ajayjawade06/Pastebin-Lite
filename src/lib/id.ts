import { nanoid } from 'nanoid';
import { SHORT_ID_LENGTH } from './validation';

/**
 * Generate a short, URL-safe paste ID
 */
export function generatePasteId(): string {
  return nanoid(SHORT_ID_LENGTH);
}
