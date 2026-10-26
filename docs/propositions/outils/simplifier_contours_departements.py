"""Simplifie les contours de départements pour l'affichage web (carte A4e).

Usage : python3 simplifier_contours_departements.py <departements.geojson> <sortie.json>

Le GeoJSON d'entrée est fourni par T. SOEFOU (hors dépôt, jamais versionné). Ce script ne lit que
les propriétés code, nom, region et la géométrie. Sortie : tracés SVG par département (métropole
et Corse), projection équirectangulaire corrigée de la latitude, grille de ~1,3 km : les sommets
partagés par deux départements sont arrondis de la même façon, donc sans interstice entre voisins.
Les départements d'outre-mer ne sont pas traités (à décider en A4e).
"""
import json, math, sys

G = 0.015  # pas de la grille en degrés

def snap(ring):
    out, last = [], None
    for lon, lat in ring:
        p = (round(lon / G), round(lat / G))
        if p != last:
            out.append(p); last = p
    if len(out) > 1 and out[0] == out[-1]:
        out.pop()
    res = []
    n = len(out)
    for i in range(n):
        a, b, c = out[i - 1], out[i], out[(i + 1) % n]
        if (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) != 0:
            res.append(b)
    return res

def area(r):
    return sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r))) / 2

def main(src, dst):
    data = json.load(open(src, encoding='utf-8'))
    codes = {f"{i:02d}" for i in range(1, 96) if i != 20} | {'2A', '2B'}
    cos = math.cos(math.radians(46.5))
    polys, xs, ys = {}, [], []
    for f in data['features']:
        pr = f['properties']
        if pr['code'] not in codes:
            continue
        g = f['geometry']
        parts = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        rings = [r for r in (snap(p[0]) for p in parts) if len(r) >= 3 and abs(area(r)) >= 3]
        polys[pr['code']] = (pr, rings)
        for r in rings:
            for x, y in r:
                xs.append(x * G * cos); ys.append(y * G)
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    W = 600
    s = W / (maxx - minx)
    out = {'w': W, 'h': round((maxy - miny) * s, 1), 'deps': {}}
    for code, (pr, rings) in polys.items():
        paths, best, ba = [], None, 0
        for r in rings:
            pts = [((x * G * cos - minx) * s, (maxy - y * G) * s) for x, y in r]
            paths.append('M' + 'L'.join(f"{x:.1f} {y:.1f}" for x, y in pts) + 'Z')
            a = abs(area(pts))
            if a > ba:
                ba, best = a, pts
        cx = sum(p[0] for p in best) / len(best)
        cy = sum(p[1] for p in best) / len(best)
        out['deps'][code] = {'n': pr['nom'], 'r': pr['region'], 'd': ''.join(paths), 'c': [round(cx, 1), round(cy, 1)]}
    json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
