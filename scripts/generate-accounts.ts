// Génère les comptes fictifs de connexion (D188, D189) : empreintes dans src/data/fixtures/accounts.json (versionné),
// mots de passe en clair dans .demo-passwords.local.json (jamais versionné). Relancer remplace les deux fichiers.
// Usage : npm run demo:accounts
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { generatePassword, hashPassword } from '../src/data/password';
import zones from '../src/data/fixtures/zones.json';

type Zone = { id: string; kind: string; responsible_name: string };
const root = path.resolve(__dirname, '..');
const firstName = (z: Zone) => z.responsible_name.split(' ')[0] ?? null;
const pad = (n: number) => String(n).padStart(2, '0');

const plain: Record<string, string> = {};
const accounts: unknown[] = [];
const add = (username: string, profile: string, scope: unknown, first: string | null) => {
  const password = generatePassword();
  plain[username] = password;
  accounts.push({
    id: randomUUID(), username, profile, scope, first_name: first, active: true, must_change_password: false,
    password: hashPassword(password), created_by: null, is_demo: true,
  });
};

const all = { kind: 'all' };
// Six identifiants pour l'agence : une administration, cinq opérateurs (répartition proposée, D189 ne la fixe pas).
add('DemoAgence01', 'agency_admin', all, 'Zoé');
['Valentin', 'Inès', 'Mathis', 'Camille', 'Louna'].forEach((n, i) => add(`DemoAgence${pad(i + 2)}`, 'agency_operator', all, n));
add('DemoDirection01', 'direction_client', all, 'Ulysse');
(zones as Zone[]).filter((z) => z.kind === 'dr').forEach((z, i) => add(`DemoDR${pad(i + 1)}`, 'dr_client', { kind: 'dr', ids: [z.id] }, firstName(z)));
(zones as Zone[]).filter((z) => z.kind === 'cvr').forEach((z, i) => add(`DemoCVR${pad(i + 1)}`, 'cvr_client', { kind: 'cvr', ids: [z.id] }, firstName(z)));
add('DemoPresta01', 'provider_admin', all, null);

writeFileSync(path.join(root, 'src/data/fixtures/accounts.json'), `${JSON.stringify(accounts, null, 2)}\n`);
writeFileSync(path.join(root, '.demo-passwords.local.json'), `${JSON.stringify(plain, null, 2)}\n`, { mode: 0o600 });
console.log(`${accounts.length} comptes fictifs écrits. Mots de passe : .demo-passwords.local.json (non versionné).`);
