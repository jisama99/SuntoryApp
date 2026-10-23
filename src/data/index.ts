import { createAccountRepository, createDemoProfileDirectory, createMemoryRepository } from './memory-repository';

// Étape A : implémentation en mémoire. Étape B : adaptateur PostgreSQL derrière la même interface.
export const repository = createMemoryRepository();
export const profileDirectory = createDemoProfileDirectory();
export const accountRepository = createAccountRepository();
