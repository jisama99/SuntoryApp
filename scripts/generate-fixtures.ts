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
write('campaigns.json', f.campaigns);
write('stores.json', f.stores);
write('week-closures.json', f.weekClosures);
write('needs.json', f.needs);
write('events.json', f.events);
console.log(
  `Fixtures écrites : ${f.zones.length} zones, ${f.profiles.length} profils, ${f.alerts.length} alertes, ${f.needs.length} besoins, ${f.stores.length} magasins, ${f.events.length} événements.`,
);
