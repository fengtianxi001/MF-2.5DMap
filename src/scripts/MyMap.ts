import * as THREE from 'three';
import * as d3 from 'd3';
import axios from 'axios';
import MyThree from './MyThree';
import turfCenter from '@turf/center';
import { forEach, size, flattenDepth, flattenDeep } from 'lodash-es';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeojsonType, CoordinatesType, FeatureDataType, MeshType } from '../types/index';
import { EXTRUDE_GEOMETRY_OPTIONS } from '../config/index';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import com from '../components/AreaLabel.vue';
import { createApp } from 'vue';

class MyMap {
  element: HTMLElement;
  mythree: MyThree;
  meshGroup: THREE.Group;
  lineGroup: THREE.Group;
  proj: d3.GeoProjection | null;
  raycaster: THREE.Raycaster;
  constructor(element: HTMLElement) {
    this.proj = null;
    this.element = element;
    this.mythree = new MyThree(element);
    this.meshGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
    // this.initial();
  }
  initial(): void {
    const { mythree, meshGroup, lineGroup } = this;
    mythree.scene.remove(this.meshGroup);
    mythree.scene.remove(this.lineGroup);
    this.meshGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    mythree.scene.add(this.meshGroup).add(this.lineGroup);
    this.mythree.removeAllLabel();
    const list = document.querySelectorAll('.label');
    mythree.CSSRender.domElement.innerHTML = '';
  }
  initProj(geojson: any): d3.GeoProjection {
    //地图投影,根据geojson数据计算出地图投影
    const center = turfCenter(geojson).geometry.coordinates as CoordinatesType;
    return d3.geoMercator().scale(30).center(center).translate([0, 0]);
  }
  async loadData(url: string) {
    //开始加载数据并开始渲染
    this.initial();
    const { data: geojson } = await axios.get(url);
    this.proj = this.initProj(geojson);
    const features = this.parseData(geojson);
    console.log('features', features);
    //开始构建
    forEach(features, (feature) => {
      this.createMesh(feature);
      this.createLine(feature);
      this.createLabel(feature);
    });
    this.createOutline();
    this.eventBind();
  }
  parseData(geojson: GeojsonType): Array<FeatureDataType> {
    //解析json数据返回当前范围下的行政区划数据(邮编、名称、中心点、坐标)
    const features = geojson.features;
    const list: FeatureDataType[] = [];
    features.map((feature, index) => {
      const code = feature.properties?.code;
      const centroid = feature.properties?.centroid ?? feature.properties?.center;
      const name = feature.properties?.name;
      const coordinates = feature.geometry.coordinates as FeatureDataType['coordinates'];
      const childrenNum = feature.properties?.childrenNum;
      const filename = feature.properties?.filename;
      list.push({
        code,
        centroid,
        name,
        coordinates,
        childrenNum,
        filename,
      });
    });
    return list;
  }
  createMesh(feature: FeatureDataType) {
    const geometryList: Array<THREE.ExtrudeGeometry> = [];
    forEach(feature.coordinates, (part) => {
      forEach(part, (item) => {
        const shape = new THREE.Shape();
        forEach(item, (point, index: number) => {
          //@ts-ignore
          const [x, y] = this.proj(point);
          if (index === 0) return shape.moveTo(x, -y);
          return shape.lineTo(x, -y);
        });
        const geometry = new THREE.ExtrudeGeometry(shape, EXTRUDE_GEOMETRY_OPTIONS);
        // const mergeGeometries = mergeBufferGeometries([geometry], true);
        // const material = new THREE.MeshPhongMaterial({
        //   color: '#2a3556',
        // });
        // const mesh = new THREE.Mesh(mergeGeometries, material);
        // mesh.translateZ(-0.5);
        // mesh.position.set(0, 0, -0.1);
        geometryList.push(geometry);
      });
    });
    const material = new THREE.MeshPhongMaterial({
      color: '#2a3556',
    });
    const geometries = mergeBufferGeometries(geometryList, true);
    const mesh = new THREE.Mesh(geometries, material);
    mesh.translateZ(-0.5);
    mesh.position.set(0, 0, -0.1);
    mesh.userData = {
      code: feature.code,
      name: feature.name,
      childrenNum: feature.childrenNum,
      filename: feature.filename,
    };
    this.meshGroup.add(mesh);
  }
  createLine(feature: FeatureDataType) {
    forEach(feature.coordinates, (part) => {
      forEach(part, (item) => {
        const geometry = new THREE.BufferGeometry();
        const pointsArray = new Array();
        forEach(item, (point) => {
          //@ts-ignore
          const [x, y] = this.proj(point);
          pointsArray.push(new THREE.Vector3(x, -y, 1.2));
        });
        const material = new THREE.MeshBasicMaterial({
          color: '#438cef',
        });
        geometry.setFromPoints(pointsArray);
        const line = new THREE.Line(geometry, material);
        this.lineGroup.add(line);
      });
    });
  }
  createLabel(feature: FeatureDataType) {
    if (!feature.centroid) return false;
    //@ts-ignore
    const [x, y] = this.proj(feature.centroid);
    const container = document.createElement('div');
    container.className = `${feature.name} label`;
    createApp(com, {
      code: feature.code,
      name: feature.name,
    }).mount(container);
    this.mythree.addLabel(container, [x, -y, 1]);
  }
  createOutline() {
    const { clientWidth, clientHeight } = this.element;
    const { camera, scene, renderer } = this.mythree;
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const selectedObjects = [...this.meshGroup.children];
    const outlinePass = new OutlinePass(new THREE.Vector2(clientWidth, clientHeight), scene, camera, selectedObjects);
    outlinePass.renderToScreen = true;
    outlinePass.selectedObjects = selectedObjects;
    composer.addPass(renderPass);
    composer.addPass(outlinePass);
    const params = {
      edgeStrength: 10,
      edgeGlow: 1,
      edgeThickness: 1,
      pulsePeriod: 10,
      usePatternTexture: false,
    };
    outlinePass.edgeStrength = params.edgeStrength;
    outlinePass.edgeGlow = params.edgeGlow;
    outlinePass.visibleEdgeColor.set('#448ef7');
    outlinePass.hiddenEdgeColor.set('#448ef7');
    this.mythree.composers.push(composer);
  }
  eventBind() {
    const pointer = new THREE.Vector2();
    let INTERSECTED: any;
    this.mythree.renderMixins.push(() => {
      this.raycaster.setFromCamera(pointer, this.mythree.camera);
      const intersects = this.raycaster.intersectObjects(this.meshGroup.children, false);
      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
          INTERSECTED = intersects[0].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          INTERSECTED.material.emissive?.setHex(0xff0000);
        }
      } else {
        if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
      }
    });
    document.addEventListener('mousemove', (e) => {
      const { clientHeight, clientWidth } = this.element;
      pointer.x = (e.clientX / clientWidth) * 2 - 1;
      pointer.y = -(e.clientY / clientHeight) * 2 + 1;
    });
    document.addEventListener('click', (e) => {
      const { clientHeight, clientWidth } = this.element;
      pointer.x = (e.clientX / clientWidth) * 2 - 1;
      pointer.y = -(e.clientY / clientHeight) * 2 + 1;
      this.raycaster.setFromCamera(pointer, this.mythree.camera);
      const intersects = this.raycaster.intersectObjects(this.meshGroup.children, false);
      if (intersects.length <= 0) return void 0;
      //   const code = intersects[0].object.userData.code;
      const { childrenNum, filename } = intersects[0].object.userData;
      console.log(childrenNum);
      if (childrenNum > 0) {
        this.loadData(`https://geojson.cn/data/${filename}.json`);
      }
    });
  }
}
export default MyMap;
