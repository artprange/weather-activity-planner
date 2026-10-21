import hashlib
import json
from pathlib import Path
import sys

source = Path(sys.argv[1]).read_bytes()
expected = '271f1c4c1908312bac6b29d158ea1356544beafc129f260005300913aa5ea283'
if hashlib.sha256(source).hexdigest() != expected:
    raise ValueError('Unexpected coastline source checksum')
features = json.loads(source)['features']
lines = []
excluded = 0
for feature in features:
    geometry = feature['geometry']
    if geometry['type'] == 'LineString':
        parts = [geometry['coordinates']]
    elif geometry['type'] == 'MultiLineString':
        parts = geometry['coordinates']
    else:
        raise ValueError('Unexpected coastline geometry')
    for part in parts:
        if all(45 < lon < 56 and 35 < lat < 49 for lon, lat in part):
            excluded += 1
            continue
        lines.append([[round(lon, 5), round(lat, 5)] for lon, lat in part])
target = Path(__file__).resolve().parents[1] / 'src/locations/data/coastline.json'
target.write_text(json.dumps(lines, separators=(',', ':')) + '\n')
print(f'{len(lines)} lines; {excluded} Caspian lines excluded; {target.stat().st_size} bytes')
