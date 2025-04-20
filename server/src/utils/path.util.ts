// server/src/utils/path.util.ts
import * as path from 'path';

/**
 * Resolves a path relative to the project root (not dist).
 */
export const getProjectRootPath = (...segments: string[]) => {
  return path.join(process.cwd(), ...segments);
};
