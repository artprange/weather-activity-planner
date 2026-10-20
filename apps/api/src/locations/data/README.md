# Ocean coastline snapshot

Source: Natural Earth, 1:50 million coastline, maintained GeoJSON distribution:
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_coastline.geojson

Retrieved 2026-10-20. Original SHA-256:
`271f1c4c1908312bac6b29d158ea1356544beafc129f260005300913aa5ea283`

Data is public domain: https://www.naturalearthdata.com/about/terms-of-use/
Dataset details and known limitations:
https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-coastline/

`coastline.json` retains the source line segments, flattens MultiLineStrings and rounds coordinates to five decimal places. Six lines entirely inside the Caspian Sea bounding box (45–56°E, 35–49°N) are excluded because this landlocked lake and its islands are included in the source. No ordinary river/lake datasets are used. Regenerate from the checksum-verified source with:

```
python3 apps/api/scripts/prepareCoastline.py /tmp/ne_50m_coastline.geojson
```

The server measures spherical distance to segments, including their endpoints, rather than nearest vertices. Data is bundled with the backend, with no request-time download and no browser payload. TypeScript copies the imported JSON into the production output.

Policy: a 25 km nearby-coast radius plus a conservative 10 km mapping tolerance. Only distances over 35 km produce NO_NEARBY_COAST. This is a proximity filter, not a beach/resort catalog, municipal boundary classification, route distance or guarantee of a surf spot. The generalized source omits some minor islands and has regional positional inaccuracies; the tolerance mitigates but cannot eliminate those limits. Coastal locations still need valid marine/weather forecasts and retain the existing marine-grid distance check.
