import {
  createVNode,
  defineComponent,
  h,
  onMounted,
  ref,
  render,
  shallowRef,
} from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/addons/renderers/CSS2DRenderer.js'
import TWEEN from '@tweenjs/tween.js'

export function useThree() {
  const container = ref<HTMLDivElement>()
  const camera = shallowRef<THREE.Camera>()
  const scene = shallowRef<THREE.Scene>()
  const control = shallowRef<OrbitControls>()
  const renderer = shallowRef<THREE.WebGLRenderer>()
  const labelRenderer = shallowRef<CSS2DRenderer>()
  const renderMixins = shallowRef<any>([])
  const composerMixins = shallowRef<any>([])

  const animate = () => {
    TWEEN.update()
    control.value?.update()
    renderMixins.value.forEach((mixin: any) => mixin())
    composerMixins.value.forEach((mixin: any) => mixin())
    renderer.value!.render(scene.value!, camera.value!)
    labelRenderer.value!.render(scene.value!, camera.value!)
    requestAnimationFrame(animate)
  }

  const generateLights = () => {
    const directionalLight1 = new THREE.DirectionalLight(0x7af4ff, 1)
    directionalLight1.position.set(106.59893798828125, 26.918846130371094, 30)
    const directionalLight2 = new THREE.DirectionalLight(0x7af4ff, 1)
    directionalLight2.position.set(106.59893798828125, 26.918846130371094, 30)
    const ambientLight = new THREE.AmbientLight(0x7af4ff, 1)
    scene.value!.add(directionalLight1)
    scene.value!.add(directionalLight2)
    scene.value!.add(ambientLight)
  }

  const createCSSObject = (options: {
    component: any
    position: [number, number, number]
    props: any
  }) => {
    const newComponent = defineComponent({
      render() {
        return h(options.component, options.props)
      },
    })
    const instance = createVNode(newComponent)
    render(instance, document.createElement('div'))
    const object = new CSS2DObject(instance.el as HTMLElement)
    object.position.set(...options.position)
    return object
  }

  const boostrap = () => {
    const { clientWidth, clientHeight } = container.value as HTMLDivElement
    camera.value = new THREE.PerspectiveCamera(
      65,
      clientWidth / clientHeight,
      0.001,
      90000000
    )
    camera.value.up.set(0, 0, 1)
    camera.value.position.set(0, 0, 0)
    scene.value = new THREE.Scene()
    renderer.value = new THREE.WebGLRenderer()
    renderer.value.setPixelRatio(window.devicePixelRatio)
    renderer.value.setSize(clientWidth, clientHeight)
    renderer.value.outputEncoding = THREE.sRGBEncoding
    labelRenderer.value = new CSS2DRenderer()
    labelRenderer.value.setSize(clientWidth, clientHeight)
    labelRenderer.value.domElement.style.position = 'absolute'
    labelRenderer.value.domElement.style.top = '0px'
    container.value!.appendChild(labelRenderer.value.domElement)
    container.value!.appendChild(renderer.value.domElement)
    control.value = new OrbitControls(
      camera.value,
      labelRenderer.value.domElement
    )
    control.value.enableDamping = true
    control.value.dampingFactor = 0.05
    animate()
    generateLights()
  }

  onMounted(() => {
    boostrap()
  })

  return {
    container,
    camera,
    scene,
    renderer,
    labelRenderer,
    control,
    renderMixins,
    boostrap,
    createCSSObject,
  }
}
