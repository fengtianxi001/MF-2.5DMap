import { MultiPolygon, Polygon } from 'geojson';

export type GeojsonType = GeoJSON.FeatureCollection<MultiPolygon | Polygon>;
export type CoordinatesType = [number, number];

export type FeatureDataType = {
  code: string;
  centroid: [number, number];
  name: string;
  coordinates: Array<Array<CoordinatesType>>;
  childrenNum: number;
  filename: string;
};

export type MeshType = THREE.Object3D<THREE.Event>[] | THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial[]> | undefined