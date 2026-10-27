/**
 * Hyderabad Major Stormwater Drains & Culvert Network GeoJSON
 * Source: OpenStreetMap & GHMC Storm Water Drainage Master Plan
 */

export const HYDERABAD_DRAINS = {
  type: "FeatureCollection" as const,
  metadata: {
    source: "OpenStreetMap & GHMC Storm Water Drainage Master Plan",
    city: "Hyderabad",
    crs: "EPSG:4326"
  },
  features: [
    {
      type: "Feature" as const,
      id: "drain-musi-river",
      properties: {
        name: "Musi River Channel",
        type: "Primary River",
        length_km: 18.2,
        width_m: 45,
        condition: "clear",
        water_level_m: 2.8,
        danger_level_m: 4.5,
        last_inspected: "2026-10-25T15:00:00Z",
        flow_direction: "West-to-East"
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [78.410, 17.375],
          [78.435, 17.371],
          [78.460, 17.368],
          [78.490, 17.369],
          [78.520, 17.373],
          [78.555, 17.385],
          [78.580, 17.395]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "drain-begumpet-nala",
      properties: {
        name: "Begumpet Nala (Hussain Sagar Surplus)",
        type: "Major Storm Nala",
        length_km: 7.4,
        width_m: 12,
        condition: "partially blocked",
        water_level_m: 1.9,
        danger_level_m: 2.5,
        last_inspected: "2026-10-25T13:00:00Z",
        flow_direction: "South-to-North"
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [78.472, 17.425],
          [78.474, 17.438],
          [78.476, 17.452],
          [78.482, 17.465]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "drain-shah-hatim-nala",
      properties: {
        name: "Shah Hatim Talab Outflow Drain",
        type: "Secondary Storm Nala",
        length_km: 4.1,
        width_m: 6,
        condition: "blocked",
        water_level_m: 1.4,
        danger_level_m: 1.8,
        last_inspected: "2026-10-25T12:00:00Z",
        notes: "Severe water hyacinth and construction debris choking culvert under Nadeem Colony bridge."
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [78.415, 17.390],
          [78.422, 17.385],
          [78.429, 17.378],
          [78.435, 17.372]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "drain-kukatpally-nala",
      properties: {
        name: "Kukatpally Lake Outflow Nala",
        type: "Major Storm Nala",
        length_km: 9.2,
        width_m: 14,
        condition: "partially blocked",
        water_level_m: 2.1,
        danger_level_m: 3.0,
        last_inspected: "2026-10-25T11:00:00Z",
        notes: "Silt build-up near Moosapet junction."
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [78.400, 17.495],
          [78.412, 17.480],
          [78.425, 17.465],
          [78.440, 17.450]
        ]
      }
    },
    {
      type: "Feature" as const,
      id: "drain-palle-cheruvu-nala",
      properties: {
        name: "Palle Cheruvu to Musi Channel",
        type: "Secondary Storm Nala",
        length_km: 5.6,
        width_m: 8,
        condition: "blocked",
        water_level_m: 1.7,
        danger_level_m: 2.0,
        last_inspected: "2026-10-25T10:00:00Z",
        notes: "Solid waste blockage at Al Jubail culvert entrance."
      },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [78.472, 17.315],
          [78.479, 17.332],
          [78.485, 17.350],
          [78.490, 17.368]
        ]
      }
    }
  ]
};
