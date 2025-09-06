/**
 * UI-related type definitions
 */

import { ReactNode } from 'react';

/**
 * Documentation section interface for technical documentation
 */
interface DocSection {
  id: string;
  title: string;
  content: ReactNode;
  subsections?: DocSection[];
}

export { type DocSection };
