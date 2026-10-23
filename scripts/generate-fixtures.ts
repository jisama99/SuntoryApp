import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildFixtures } from './fixtures-core';

const out = path.resolve(__dirname, '../src/data/fixtures');
const f = buildFixtures();
const write = (name: string, data: unknown) =>
  writeFileSync(path.join(out, name), JSON.stringify(data, null, 2) + '\n', 'utf8');

write('zones.json', f.zones);
write('profiles.json', f.profiles);
write('alerts.json', f.alerts);
write('clock.json', f.clock);
console.log(`Fixtures écrites : ${f.zones.length} zones, ${f.profiles.length} profils, ${f.alerts.length} alertes.`);
