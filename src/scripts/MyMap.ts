import * as THREE from 'three';
import * as d3 from 'd3';
import axios from 'axios';
import MyThree from './MyThree';
import turfCenter from '@turf/center';
import { forEach } from 'lodash-es';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeojsonType, CoordinatesType, FeatureDataType } from '../types/index';
import { EXTRUDE_GEOMETRY_OPTIONS } from '../config/index';
class MyMap {
  element: HTMLElement;
  mythree: MyThree;
  meshGroup: THREE.Group;
  lineGroup: THREE.Group;
  proj: d3.GeoProjection | null;
  constructor(element: HTMLElement) {
    this.proj = null;
    this.element = element;
    this.mythree = new MyThree(element);
    this.meshGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.initial();
  }
  initial(): void {
    const { mythree, meshGroup, lineGroup } = this;
    mythree.scene.add(meshGroup).add(lineGroup);
  }
  initProj(geojson: any): d3.GeoProjection {
    //地图投影,根据geojson数据计算出地图投影
    const center = turfCenter(geojson).geometry.coordinates as CoordinatesType;
    return d3.geoMercator().scale(30).center(center).translate([0, 0]);
  }
  async loadData(url: string) {
    //开始加载数据并开始渲染
    const { data: geojson } = await axios.get(url);
    this.proj = this.initProj(geojson);
    const features = this.parseData(geojson);
    //开始构建
    forEach(features, (feature) => {
      this.createMesh(feature);
      this.createLine(feature);
      this.createLabel(feature)
    });
  }
  parseData(geojson: GeojsonType): Array<FeatureDataType> {
    //解析json数据返回当前范围下的行政区划数据(邮编、名称、中心点、坐标)
    const features = geojson.features;
    return features.map((feature) => {
      const adcode = feature.properties?.adcode;
      const centroid = feature.properties?.centroid ?? feature.properties?.center;
      const name = feature.properties?.name;
      const type = feature.geometry.type;
      const coordinates = feature.geometry.coordinates;
      return {
        adcode,
        centroid,
        name,
        coordinates: type === 'MultiPolygon' ? coordinates[0][0] : coordinates[0],
      };
    }) as FeatureDataType[];
  }
  createMesh(feature: FeatureDataType) {
    const shape = new THREE.Shape();
    //根据坐标点构建出shape
    forEach(feature.coordinates, (point: CoordinatesType, index: number) => {
      //@ts-ignore
      const [x, y] = this.proj(point);
      if (index === 0) return shape.moveTo(x, -y);
      return shape.lineTo(x, -y);
    });
    const geometry = new THREE.ExtrudeGeometry(shape, EXTRUDE_GEOMETRY_OPTIONS);
    const mergeGeometries = mergeBufferGeometries([geometry], true);
    const material = new THREE.MeshBasicMaterial({
      transparent: false,
      opacity: 110,
    });
    const mesh = new THREE.Mesh(mergeGeometries, [material]);
    mesh.translateZ(-0.5);
    mesh.position.set(0, 0, -0.1);
    this.meshGroup.add(mesh);
  }
  createLine(feature: FeatureDataType) {
    const geometry = new THREE.BufferGeometry();
    const pointsArray = new Array();
    forEach(feature.coordinates, (point: CoordinatesType) => {
      //@ts-ignore
      const [x, y] = this.proj(point);
      pointsArray.push(new THREE.Vector3(x, -y, 1.2));
    });
    geometry.setFromPoints(pointsArray);
    const material = new THREE.MeshBasicMaterial({
      color: 0xf40f40,
    });
    const line = new THREE.Line(geometry, material);
    this.lineGroup.add(line);
  }
  createLabel(feature: FeatureDataType){
    
  }
}
export default MyMap;
