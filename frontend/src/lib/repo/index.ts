import { createLocalRepo } from './local';
import { createRemoteRepo } from './remote';
import type { DataRepo } from './types';

export type DataSource = 'local' | 'remote';

export const dataSource: DataSource = import.meta.env.VITE_DATA_SOURCE === 'remote' ? 'remote' : 'local';

/** Swap dummy data for the CodeIgniter API with one env var. */
export const repo: DataRepo = dataSource === 'remote' ? createRemoteRepo() : createLocalRepo();

export { messageOf } from './types';
export type { DataRepo } from './types';
