import urllib.request
import json
import time
import gzip

ne_cods = {
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB",
    "26": "PE", "27": "AL", "28": "SE", "29": "BA"
}

all_points = []
state_polygons = {}
    
def extract_rings(geometry):
    rings = []
    if geometry['type'] == 'Polygon':
        rings = geometry['coordinates']
    elif geometry['type'] == 'MultiPolygon':
        for poly in geometry['coordinates']:
            rings.extend(poly)
    return rings

try:
    for cod, uf in ne_cods.items():
        url = f"https://servicodados.ibge.gov.br/api/v3/malhas/estados/{cod}?formato=application/vnd.geo+json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            if response.info().get('Content-Encoding') == 'gzip':
                data = json.loads(gzip.decompress(response.read()).decode('utf-8'))
            else:
                data = json.loads(response.read().decode('utf-8'))
        
        rings = []
        for feature in data['features']:
            rings.extend(extract_rings(feature['geometry']))
        
        state_polygons[uf] = rings
        for ring in rings:
            for pt in ring:
                all_points.append(pt)
        time.sleep(0.5) # rate limit prevention

    # Min/Max bounding box for Northeast
    min_x = min(p[0] for p in all_points)
    max_x = max(p[0] for p in all_points)
    min_y = min(p[1] for p in all_points)
    max_y = max(p[1] for p in all_points)
    
    width = max_x - min_x
    height = max_y - min_y
    
    # 800x800 map
    scale_x = 760 / width
    scale_y = 760 / height
    scale = min(scale_x, scale_y)
    
    dx = (800 - width * scale) / 2
    dy = (800 - height * scale) / 2
    
    paths = []
    for uf, rings in state_polygons.items():
        d_path = ""
        for ring in rings:
            d_path += "M "
            for i, p in enumerate(ring):
                px = (p[0] - min_x) * scale + dx
                # Invert Y for SVG coordinates
                py = 800 - ((p[1] - min_y) * scale + dy)
                if i == 0:
                    d_path += f"{px:.1f},{py:.1f} "
                else:
                    d_path += f"L {px:.1f},{py:.1f} "
            d_path += "Z "
            
        paths.append(f'<path id="{uf}" class="estado-shape" data-nome="{uf}" d="{d_path.strip()}" />')

    # Add labels over the centers
    labels = ""

    svg = f"""const mapaNordesteSVG = `<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
<g id="mapa-estados" stroke-linejoin="round">
{"\n".join(paths)}
</g>
<g id="mapa-labels">
<text x="210" y="270" fill="#E8EDF7" font-size="28" font-weight="bold">MA</text>
<text x="310" y="360" fill="#E8EDF7" font-size="28" font-weight="bold">PI</text>
<text x="510" y="220" fill="#E8EDF7" font-size="26" font-weight="bold">CE</text>
<text x="680" y="280" fill="#E8EDF7" font-size="20" font-weight="bold">RN</text>
<text x="680" y="340" fill="#E8EDF7" font-size="20" font-weight="bold">PB</text>
<text x="630" y="400" fill="#E8EDF7" font-size="20" font-weight="bold">PE</text>
<text x="670" y="470" fill="#E8EDF7" font-size="16" font-weight="bold">AL</text>
<text x="620" y="520" fill="#E8EDF7" font-size="16" font-weight="bold">SE</text>
<text x="450" y="550" fill="#E8EDF7" font-size="32" font-weight="bold">BA</text>
</g>
</svg>`;"""
        
    with open("E:/Prototipo_BNB/mapa_nordeste.js", "w", encoding="utf-8") as f:
        f.write(svg)
    print("Map successfully built from IBGE API and written to mapa_nordeste.js")
except Exception as e:
    print("Error:", e)
