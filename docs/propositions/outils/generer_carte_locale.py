"""Génère, SUR LE POSTE DE T. SOEFOU SEULEMENT, une copie locale de l'aperçu de carte avec les vrais magasins.

Usage : SUNTORY_GEO_PATH="<dossier FICHIERS POUR DEPARTEMENTS>" python3 generer_carte_locale.py <apercu.html> <sortie.html>

Lit (en local, jamais versionnés) dans le dossier SUNTORY_GEO_PATH : departements-5m.geojson,
communes-5m.geojson, BASE OFFICIELLE DES CP.csv, LISTING MAGASINS DEPARTEMENTS - NETTOYE V2.xlsx (feuille MAGASINS).
Pose chaque magasin au centre de sa commune (nom puis code postal), avec un léger décalage si plusieurs
magasins partagent la commune. Écrit un HTML qui contient des données réelles : bandeau « DONNÉES RÉELLES LOCALES ».
La sortie ne doit jamais être versionnée, copiée dans le dépôt, envoyée ni capturée. Seuls des effectifs sont affichés ici.
Les noms de responsables (RS) ne sont pas lus. Dépend de openpyxl. Origine et projection : identiques à
simplifier_contours_departements.py (même grille, même cosinus), donc les points tombent dans les bons contours.
"""
import csv, json, math, os, sys, unicodedata
import openpyxl
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import simplifier_contours_departements as S


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    for ch in "-'’,./":
        s = s.replace(ch, ' ')
    w = [{'saint': 'st', 'sainte': 'ste'}.get(x, x) for x in s.split() if x not in ('le', 'la', 'les', 'l', 'd', 'de', 'du', 'des', 'sur', 'en', 'sous')]
    return ' '.join(w)


def projection(folder):
    cos = math.cos(math.radians(46.5))
    codes = {f"{i:02d}" for i in range(1, 96) if i != 20} | {'2A', '2B'}
    data = json.load(open(os.path.join(folder, 'departements-5m.geojson'), encoding='utf-8'))
    xs, ys = [], []
    for f in data['features']:
        if f['properties']['code'] not in codes:
            continue
        g = f['geometry']
        parts = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for p in parts:
            r = S.snap(p[0])
            if len(r) >= 3 and abs(S.area(r)) >= 3:
                for x, y in r:
                    xs.append(x * S.G * cos); ys.append(y * S.G)
    minx, maxx, maxy = min(xs), max(xs), max(ys)
    s = 600 / (maxx - minx)
    return codes, (lambda lon, lat: (round((lon * cos - minx) * s, 1), round((maxy - lat) * s, 1)))


def commune_centers(folder):
    data = json.load(open(os.path.join(folder, 'communes-5m.geojson'), encoding='utf-8'))
    by_code, by_name = {}, {}
    for f in data['features']:
        pr, g = f['properties'], f['geometry']
        parts = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        ring = max((p[0] for p in parts), key=len)
        lon = sum(p[0] for p in ring) / len(ring); lat = sum(p[1] for p in ring) / len(ring)
        by_code[pr['code']] = (lon, lat)
        by_name.setdefault((str(pr['departement']), norm(pr['nom'])), pr['code'])
    return by_code, by_name


def cp_index(folder):
    by_cp_name, by_cp = {}, {}
    with open(os.path.join(folder, 'BASE OFFICIELLE DES CP.csv'), encoding='latin-1', newline='') as fh:
        rd = csv.reader(fh, delimiter=';'); next(rd)
        for r in rd:
            insee, nom, cp, lib = r[0].zfill(5), r[1], r[2].zfill(5), r[3]
            by_cp_name[(cp, norm(nom))] = insee; by_cp_name[(cp, norm(lib))] = insee
            by_cp.setdefault(cp, set()).add(insee)
    return by_cp_name, by_cp


def main(template, dst):
    folder = os.environ.get('SUNTORY_GEO_PATH')
    if not folder or not os.path.isdir(folder):
        sys.exit('Variable SUNTORY_GEO_PATH absente ou invalide : arrêt (aucun repli).')
    codes, proj = projection(folder)
    centers, names = commune_centers(folder)
    cpn, cpi = cp_index(folder)
    wb = openpyxl.load_workbook(os.path.join(folder, 'LISTING MAGASINS DEPARTEMENTS - NETTOYE V2.xlsx'), read_only=True, data_only=True)
    rows = list(wb['MAGASINS'].iter_rows(values_only=True)); h = [unicodedata.normalize('NFC', str(x or '')).strip() for x in rows[0]]
    ix = {n: h.index(unicodedata.normalize('NFC', n)) for n in ['Magasin (nettoyé)', 'Enseigne', 'Format', 'Code postal', 'Dép.', 'Ville', 'Code DR', 'Code CVR', 'Statut liaison']}
    ens = sorted({r[ix['Enseigne']] for r in rows[1:] if r[ix['Enseigne']]}, key=lambda e: -sum(1 for r in rows[1:] if r[ix['Enseigne']] == e))
    stat = {'Complète': 0, 'Absente': 1, 'Conflit': 2}
    out, seen, cnt = [], {}, {'nom': 0, 'cp': 0, 'ecart': 0, 'hors_metropole': 0}
    for r in rows[1:]:
        d = str(r[ix['Dép.']] or '').strip().upper().zfill(2)
        if d not in codes:
            cnt['hors_metropole'] += 1; continue
        cp = str(r[ix['Code postal']] or '').strip().zfill(5)
        v = norm(r[ix['Ville']]); insee = names.get((d, v))
        if insee:
            cnt['nom'] += 1
        else:
            insee = cpn.get((cp, v)) or (next(iter(cpi[cp])) if len(cpi.get(cp, ())) == 1 else None)
            if insee in centers:
                cnt['cp'] += 1
            else:
                cnt['ecart'] += 1; continue
        lon, lat = centers[insee]; x, y = proj(lon, lat)
        k = seen.get(insee, 0); seen[insee] = k + 1
        if k:
            a = k * 2.4; x += 1.1 * math.sqrt(k) * math.cos(a); y += 1.1 * math.sqrt(k) * math.sin(a)
        out.append({'d': d, 'xy': [round(x, 1), round(y, 1)], 'e': ens.index(r[ix['Enseigne']]), 'st': stat.get(r[ix['Statut liaison']], 1),
                    'nm': r[ix['Magasin (nettoyé)']] or '', 'v': r[ix['Ville']] or '', 'fm': r[ix['Format']] or '',
                    'cvr': str(r[ix['Code CVR']] or ''), 'dr': str(r[ix['Code DR']] or '')})
    payload = 'window.REAL_STORES=' + json.dumps({'ens': ens, 'stores': out}, ensure_ascii=False, separators=(',', ':')) + ';'
    html = open(template, encoding='utf-8').read()
    marker = '<script>\n(function(){'
    if marker not in html:
        sys.exit('Gabarit inattendu : point d\'injection introuvable.')
    open(dst, 'w', encoding='utf-8').write(html.replace(marker, '<script>' + payload + '</script>' + marker, 1))
    print(f"magasins placés : {len(out)} (par nom {cnt['nom']}, par code postal {cnt['cp']}) ; non placés : {cnt['ecart']} ; hors métropole : {cnt['hors_metropole']}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
