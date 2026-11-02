// The run file, checked. Importing this fails the build if the file is wrong.
import runFile from '../content/run.json';
import { parseRun } from './run';

export const run = parseRun(runFile);
