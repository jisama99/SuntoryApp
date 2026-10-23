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
write('deadline-settings.json', f.deadlineSettings);
write('dispositif-params.json', f.dispositifParams);
write('reopening-requests.json', f.reopeningRequests);
write('reopenings.json', f.reopenings);
write('recruitments.json', f.recruitments);
write('proposals.json', f.proposals);
write('decisions.json', f.decisions);
write('notes.json', f.notes);
write('validations.json', f.validations);
write('delegations.json', f.delegations);
console.log(
  `Fixtures écrites : ${f.zones.length} zones, ${f.profiles.length} profils, ${f.alerts.length} alertes, ${f.needs.length} besoins, ${f.stores.length} magasins, ${f.events.length} événements, ${f.recruitments.length} suivis de recrutement, ${f.proposals.length} propositions, ${f.decisions.length} décisions, ${f.notes.length} notes, ${f.validations.length} traces de validation, ${f.delegations.length} délégations.`,
);
