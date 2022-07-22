import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module.js';
//@ts-ignore
import TWEEN from '@tweenjs/tween.js';
class Three {
  constructor(element) {
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
  }
  initScene() {
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xffffff);
    // scene.fog = new THREE.Fog(0xffffff, 0.0001, 0.0001);
    return scene;
  }
  initCSSRender(element) {
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
  initCamera(element) {
    // const fov = 20;
    const aspect = element.offsetWidth / element.offsetHeight;
    // const near = 2;
    // const far = 1000;
    const fov = 20
    // const aspect = element.value.offsetWidth / element.value.offsetHeight
    const near = 0.1
    const far = 2000

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, -30, 100);
    return camera;
  }
  initRenderer(element) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.setSize(element.offsetWidth, element.offsetHeight);
    element.appendChild(renderer.domElement);
    // renderer.setClearColor(new THREE.Color(0xEEEEEE, 1.0));
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
  initHelp(size) {
    const axesHelper = new THREE.AxesHelper(size);
    this.scene.add(axesHelper);
  }
  initStats() {
    //@ts-ignore
    this.stats = new Stats();
    this.element.appendChild(this.stats.dom);
  }
  loadGLTF(url, onProgress = () => {}) {
    const loader = new GLTFLoader();
    return new Promise((resolve) => {
      loader.load(
        url,
        (object) => resolve(object),
        (xhr) => onProgress(xhr.loaded / 104778660)
      );
    });
  }
  playModelAnimate(mesh, animations, animationName) {
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
  addLabel(element, [x, y, z]) {
    const label = new CSS2DObject(element);
    label.position.set(x, y, z);
    this.scene.add(label);
    return label;
    // earthLabel.layers.set(0);
  }
}
export default Three;
