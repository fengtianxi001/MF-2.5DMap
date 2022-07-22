import * as THREE from 'three';
import * as d3 from 'd3';
import axios from 'axios';
import MyThree from './MyThree';
import turfCenter from '@turf/center';
import turfArea from '@turf/area';
import { forEach, size, last, reduce } from 'lodash-es';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeojsonType, CoordinatesType, FeatureDataType, MeshType } from '../types/index';
import { EXTRUDE_GEOMETRY_OPTIONS } from '../config/index';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import LabelVueComponent from '../components/AreaLabel.vue';
import { createApp } from 'vue';

class MyMap {
  element: HTMLElement;
  mythree: MyThree;
  meshGroup: THREE.Group;
  lineGroup: THREE.Group;
  proj: d3.GeoProjection | null;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  INTERSECTED: any;
  tracker: Array<string | number>;
  onHover: (e: MouseEvent) => void;
  onClick: (e: MouseEvent) => void;
  plottingScale: number;
  scale: number;
  constructor(element: HTMLElement) {
    this.proj = null;
    this.element = element;
    this.mythree = new MyThree(element);
    this.meshGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.INTERSECTED = null;
    this.onHover = this._onHover.bind(this);
    this.onClick = this._onClick.bind(this);
    this.tracker = [];
    this.plottingScale = 9542502774372.604;
    this.scale = 1;
  }
  initial(): void {
    this.memClear();
    this.meshGroup = new THREE.Group();
    this.lineGroup = new THREE.Group();
    this.mythree.scene.add(this.meshGroup).add(this.lineGroup);
    this.mythree.removeAllLabel();
  }
  initProj(geojson: any): d3.GeoProjection {
    //地图投影,根据geojson数据计算出地图投影
    const center = turfCenter(geojson).geometry.coordinates as CoordinatesType;
    // const proj = d3.geoMercator().scale(30).center(center).translate([0, 0]);
    return d3
      .geoMercator()
      .scale(30 * this.scale)
      .center(center)
      .translate([0, 0]);
  }
  async loadData(url: string) {
    //开始加载数据并开始渲染
    this.initial();
    const { data: geojson } = await axios.get(url);
    const { filename } = geojson.propertity;
    //记录用户操作路径(下钻和返回上一级)
    if (filename && last(this.tracker) !== filename) {
      this.tracker.push(geojson.propertity.filename);
    }
    //计算区域面积用于控制不同层级的缩放比例
    let area = reduce(geojson.features, (prev, feature) => (prev += turfArea(feature)), 0);
    this.scale = Math.sqrt(this.plottingScale / area);
    this.proj = this.initProj(geojson);
    const features = this.parseData(geojson);
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
    // mesh.scale.set(this.scale, this.scale, this.scale);
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
        // line.scale.set(this.scale, this.scale, this.scale);
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
    createApp(LabelVueComponent, {
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
    //悬浮行政区高亮
    this.mythree.renderMixins.push(() => {
      const { pointer } = this;
      this.raycaster.setFromCamera(pointer, this.mythree.camera);
      const intersects = this.raycaster.intersectObjects(this.meshGroup.children, false);
      //   console.log('intersects',intersects)
      if (intersects.length > 0) {
        if (this.INTERSECTED != intersects[0].object) {
          if (this.INTERSECTED) this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
          this.INTERSECTED = intersects[0].object;
          this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
          //   console.log(this.INTERSECTED.currentHex);
          this.INTERSECTED.material.emissive?.setHex(0xff0000);
        }
      } else {
        if (this.INTERSECTED) this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
        this.INTERSECTED = null;
      }
    });
    document.addEventListener('mousemove', this.onHover);
    document.addEventListener('click', this.onClick);
  }
  _onHover(e: MouseEvent) {
    const { clientHeight, clientWidth } = this.element;
    this.pointer.x = (e.clientX / clientWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / clientHeight) * 2 + 1;
  }
  _onClick(e: MouseEvent) {
    const { clientHeight, clientWidth } = this.element;
    this.pointer.x = (e.clientX / clientWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.mythree.camera);
    const intersects = this.raycaster.intersectObjects(this.meshGroup.children, false);
    //如果用户点击到模型并且模型有子集的话=>下钻
    //如果用户没点击到模型并且不在第一级别的话,返回更高级别的行政区
    if (intersects.length > 0) {
      const { childrenNum, filename } = intersects[0].object.userData;
      childrenNum > 0 && this.loadData(`https://geojson.cn/data/${filename}.json`);
    } else {
      if (size(this.tracker) > 1) {
        this.tracker.pop();
        console.log('after', this.tracker);
        const filename = last(this.tracker);
        this.loadData(`https://geojson.cn/data/${filename}.json`);
      }
    }
  }
  memClear() {
    const { mythree } = this;
    this.INTERSECTED = null;
    mythree.deleteGroup(this.meshGroup)
    mythree.deleteGroup(this.lineGroup)
    mythree.scene.remove(this.meshGroup);
    mythree.scene.remove(this.lineGroup);
    this.mythree.renderMixins.pop();
  }
}
export default MyMap;
