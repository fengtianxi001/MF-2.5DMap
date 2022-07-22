import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import TWEEN from '@tweenjs/tween.js';
class Three {
  element: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  CSSRender: CSS2DRenderer;
  control: OrbitControls;
  stats: any;
  mixers: any[];
  composers: any[];
  renderMixins: any[];
  clock: THREE.Clock;
  labelGroup: THREE.Group;
  constructor(element: HTMLElement) {
    this.element = element;
    this.scene = this.initScene();
    this.camera = this.initCamera(element);
    this.renderer = this.initRenderer(element);
    this.CSSRender = this.initCSSRender(element);
    this.control = this.initControl();
    this.stats = null;
    this.mixers = [];
    this.composers = [];
    this.renderMixins = [];
    this.clock = new THREE.Clock();
    this.render();
    this.initLight();
    this.labelGroup = new THREE.Group();
    this.scene.add(this.labelGroup);
  }
  initScene() {
    const scene = new THREE.Scene();
    return scene;
  }
  initCSSRender(element: HTMLElement) {
    const CSSRender = new CSS2DRenderer();
    CSSRender.setSize(element.offsetWidth, element.offsetHeight);
    CSSRender.domElement.style.position = 'absolute';
    CSSRender.domElement.style.top = '0px';
    element.appendChild(CSSRender.domElement);
    return CSSRender;
  }
  initLight() {
    const light = new THREE.AmbientLight(0xffffff);
    this.scene.add(light);
  }
  initCamera(element: HTMLElement) {
    const fov = 20;
    const aspect = element.offsetWidth / element.offsetHeight;
    const near = 0.1;
    const far = 2000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 100);
    return camera;
  }
  initRenderer(element: HTMLElement) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.setSize(element.offsetWidth, element.offsetHeight);
    element.appendChild(renderer.domElement);
    return renderer;
  }
  initControl() {
    const control = new OrbitControls(this.camera, this.CSSRender.domElement);
    control.target = new THREE.Vector3(0, 0, 0);
    // control.maxDistance = 0.5;
    // control.maxPolarAngle = Math.PI / 2;
    control.update();
    return control;
  }
  initHelp(size: number = 500) {
    const axesHelper = new THREE.AxesHelper(size);
    this.scene.add(axesHelper);
  }
  initStats() {
    //@ts-ignore
    this.stats = new Stats();
    this.element.appendChild(this.stats.dom);
  }
  loadGLTF(url: string, onProgress = (process: number) => void 0) {
    const loader = new GLTFLoader();
    return new Promise((resolve) => {
      loader.load(
        url,
        (object) => resolve(object),
        (xhr) => onProgress(xhr.loaded / xhr.total)
      );
    });
  }
  playModelAnimate(
    mesh: THREE.Object3D<THREE.Event> | THREE.AnimationObjectGroup,
    animations: THREE.AnimationClip[],
    animationName: string
  ) {
    const mixer = new THREE.AnimationMixer(mesh);
    const clip = THREE.AnimationClip.findByName(animations, animationName);
    if (!clip) return void 0;
    const action = mixer.clipAction(clip);
    action.play();
    this.mixers.push(mixer);
  }
  render() {
    const delta = new THREE.Clock().getDelta();
    this.renderer.render(this.scene, this.camera);

    const mixerUpdateDelta = this.clock.getDelta();
    this.mixers.forEach((mixer) => mixer.update(mixerUpdateDelta));
    this.composers.forEach((composer) => composer.render(delta));
    this.renderMixins.forEach((mixin) => mixin());
    TWEEN.update();
    this.stats && this.stats?.update();
    this.CSSRender.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }
  addLabel(element: HTMLElement, [x, y, z]: [number, number, number]) {
    const label = new CSS2DObject(element);
    label.position.set(x, y, z);
    this.labelGroup.add(label);
    return label;
  }
  removeAllLabel() {
    this.labelGroup.children.forEach((child) => {
      this.labelGroup.remove(child);
    });
    this.CSSRender.domElement.innerHTML = '';
    this.scene.remove(this.labelGroup);
    this.labelGroup = new THREE.Group();
    this.scene.add(this.labelGroup);
  }
  deleteGroup(group: THREE.Group) {
    if (!group) return;
    group.traverse(function (item) {
      if (item instanceof THREE.Mesh) {
        item.geometry.dispose(); 
        item.material.dispose();
      }
    });
  }
}
export default Three;
