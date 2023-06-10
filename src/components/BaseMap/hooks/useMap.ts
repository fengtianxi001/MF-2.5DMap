import * as THREE from 'three'
import { forEach, size } from 'lodash'
import axios from 'axios'
import { bbox, centroid } from '@turf/turf'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { ref, shallowRef, type ShallowRef } from 'vue'
import TWEEN from '@tweenjs/tween.js'
import { useThree } from './useThree'
import RegionLabel from '../src/RegionLabel.vue'

type UseMapOptions = {
  geojson: string // 数据源
  depth?: number // 地图厚度
  pitch?: number // 地图倾斜角度
}

export function useMap() {
  const {
    container,
    camera,
    scene,
    labelRenderer,
    control,
    renderMixins,
    createCSSObject,
  } = useThree()
  const params = ref<any>()
  const blockGroup = shallowRef<THREE.Group>(new THREE.Group())
  const borderGroup = shallowRef<THREE.Group>(new THREE.Group())
  const backgroundGroup = shallowRef<THREE.Group>(new THREE.Group())
  const labelGroup = shallowRef<THREE.Group>(new THREE.Group())
  const mouse = new THREE.Vector2(-10, -10)
  const raycaster = new THREE.Raycaster()
  let intersected: any = null
  // 参数调整
  const adjustParameter = (geojson: any) => {
    const [minX, minY, maxX, maxY] = bbox(geojson)
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const adjustControl = () => {
      // 视角保持在地图中心点
      const distance = Math.max(maxX - minX, maxY - minY)
      control.value?.target.set(centerX, centerY, 0)
      control.value!.maxDistance = 100
      control.value!.maxDistance = distance * 1.2
      control.value!.minDistance = distance * 0.5
      control.value!.maxPolarAngle = Math.PI / 2
    }
    const adjustCamera = () => {
      // x 保持正北方向
      // y 范围内最低维度 - 范围纬度差的一半
      // z 保持视角 45 度
      const x = centerX
      const y = minY - (maxY - minY) / 2
      const z = (maxY - y) * Math.tan(params.value.pitch * (Math.PI / 180))
      camera.value?.position.set(0, 0, 0)
      new TWEEN.Tween(camera.value!.position)
        .to({ x, y, z }, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start()
    }
    adjustControl()
    adjustCamera()
  }
  // 生成地图材质
  const generateMapMaterial = () => {
    const texture = new THREE.TextureLoader()
    const textureMap = texture.load('./texture/texture_map.jpg')
    textureMap.wrapS = THREE.RepeatWrapping
    textureMap.wrapT = THREE.RepeatWrapping
    textureMap.flipY = false
    textureMap.rotation = THREE.MathUtils.degToRad(45)
    textureMap.repeat.set(0.128, 0.128)
    textureMap.encoding = THREE.sRGBEncoding

    const faceMaterial = new THREE.MeshPhongMaterial({
      map: textureMap,
      color: 0xb4eeea,
      combine: THREE.MultiplyOperation,
      transparent: true,
      opacity: 1,
    })
    const sideMaterial = new THREE.MeshLambertMaterial({
      color: 0x123024,
      transparent: true,
      opacity: 0.95,
    })
    return () => [faceMaterial.clone(), sideMaterial.clone()]
  }
  // 生成地图形状
  const generateMapGeometry = (geojson: any) => {
    const cloneMaterial = generateMapMaterial()
    const createShapeByPolygon = (polygon: any) => {
      const shape = new THREE.Shape()
      forEach(polygon, (coordinate: [number, number], index: number) => {
        if (size(coordinate) === 2) {
          const method = index === 0 ? 'moveTo' : 'lineTo'
          shape[method](...coordinate)
        }
      })
      const extrudeSettings = {
        depth: 0.2,
        bevelEnabled: false,
        bevelSegments: 1,
        bevelThickness: 0.1,
      }
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      const mesh = new THREE.Mesh(geometry, cloneMaterial())
      blockGroup.value.add(mesh)
    }
    forEach(geojson.features, (feature) => {
      const { type, coordinates } = feature.geometry
      if (type === 'Polygon') {
        forEach(coordinates, createShapeByPolygon)
      } else {
        forEach(coordinates, (multiPolygon) =>
          forEach(multiPolygon, createShapeByPolygon)
        )
      }
    })
    scene.value!.add(blockGroup.value)
  }
  // 生成行政区的标签
  const generateMapLabel = (geojson: any) => {
    forEach(geojson.features, (feature) => {
      const { properties } = feature
      let center
      if (properties.centroid) {
        center = properties.centroid
      } else {
        center = centroid(geojson).geometry.coordinates
      }
      const options = {
        component: RegionLabel,
        position: [center[0], center[1], params.value.depth + 0.2] as [
          number,
          number,
          number
        ],
        props: { name: properties.name },
      }
      const object = createCSSObject(options)
      labelGroup.value.add(object)
    })
    scene.value!.add(labelGroup.value)
  }
  // 生成地图上边框
  const generateMapTopBorder = (geojson: any) => {
    const createLineByPolygon = (polygon: any) => {
      const points: any = []
      forEach(polygon, (coordinate: [number, number]) => {
        points.push(coordinate[0], coordinate[1], params.value.depth + 0.05)
      })
      const material = new LineMaterial({
        color: 0xffffff,
        linewidth: 0.001,
      })
      const geometry = new LineGeometry()
      geometry.setPositions(points)
      borderGroup.value.add(new Line2(geometry, material))
    }
    forEach(geojson.features, (feature) => {
      const { type, coordinates } = feature.geometry
      if (type === 'Polygon') {
        forEach(coordinates, createLineByPolygon)
      } else if (type === 'MultiPolygon') {
        forEach(coordinates, (multiPolygon) =>
          forEach(multiPolygon, createLineByPolygon)
        )
      }
    })
    scene.value!.add(borderGroup.value)
  }
  // 生成地图下边框
  const generateMapBottonBorder = (geojson: any) => {
    const createLineByPolygon = (polygon: any) => {
      const points: any = []
      forEach(polygon, (coordinate: [number, number]) => {
        points.push(coordinate[0], coordinate[1], 0)
      })
      const material = new LineMaterial({
        color: 0x36b9bc,
        linewidth: 0.002,
      })
      const geometry = new LineGeometry()
      geometry.setPositions(points)
      const line = new Line2(geometry, material)
      borderGroup.value.add(line)
    }
    forEach(geojson.features, (feature) => {
      const { type, coordinates } = feature.geometry
      if (type === 'Polygon') {
        forEach(coordinates, createLineByPolygon)
      } else if (type === 'MultiPolygon') {
        forEach(coordinates, (multiPolygon) =>
          forEach(multiPolygon, createLineByPolygon)
        )
      }
    })
    scene.value!.add(borderGroup.value)
  }
  // 生成地图平面背景
  const generatePlanes = (geojson: any) => {
    const [minX, minY, maxX, maxY] = bbox(geojson)
    const width = maxX - minX
    const height = maxY - minY
    const size = Math.max(width, height)
    const textureLoader = new THREE.TextureLoader()
    const center = [(minX + maxX) / 2, (minY + maxY) / 2] as const
    // 外围光圈
    const createOuterCircle = () => {
      const geometry = new THREE.PlaneGeometry(size, size)
      const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load('./texture/texture_circle_out.png'),
        transparent: true,
        opacity: 1,
        depthTest: true,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...center, 0)
      const scale = 1.1
      mesh.scale.set(scale, scale, scale)
      renderMixins.value.push(() => {
        mesh.rotation.z += 0.0005
      })
      backgroundGroup.value!.add(mesh)
    }
    // 内围光圈
    const createInnerCircle = () => {
      const geometry = new THREE.PlaneGeometry(size, size)
      const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load('./texture/texture_circle_inner.png'),
        transparent: true,
        opacity: 1,
        depthTest: true,
      })
      const mesh = new THREE.Mesh(geometry, material)
      const scale = 0.9
      mesh.scale.set(scale, scale, scale)
      mesh.position.set(...center, -0.02)
      renderMixins.value.push(() => {
        mesh.rotation.z -= 0.001
      })
      backgroundGroup.value!.add(mesh)
    }
    // 生成平面背景
    const createBackgroundPlane = () => {
      const geometry = new THREE.PlaneGeometry(size * 4, size * 4)
      const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load('./texture/texture_plane.png'),
        transparent: true,
        opacity: 1,
        depthTest: true,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...center, -0.2)
      backgroundGroup.value!.add(mesh)
    }
    // 生成平面点背景
    const createBackgroundDotPlane = () => {
      const geometry = new THREE.PlaneGeometry(size, size)
      const material = new THREE.MeshBasicMaterial({
        map: textureLoader.load('./texture/texture_plane_dot.png'),
        transparent: true,
        opacity: 1,
        depthTest: true,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...center, -0.1)
      backgroundGroup.value!.add(mesh)
    }
    createOuterCircle()
    createInnerCircle()
    createBackgroundPlane()
    createBackgroundDotPlane()
    scene.value!.add(backgroundGroup.value!)
  }
  // 生成监听器
  const addListeners = () => {
    mouse.x = -10
    mouse.y = -10
    intersected = null
    const handleMouseMove = (event: MouseEvent) => {
      const rect = labelRenderer.value!.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
    labelRenderer.value!.domElement.removeEventListener(
      'mousemove',
      handleMouseMove
    )
    labelRenderer.value!.domElement.addEventListener(
      'mousemove',
      handleMouseMove
    )
    renderMixins.value.push(() => {
      raycaster.setFromCamera(mouse, camera.value!)
      const intersects = raycaster.intersectObjects(
        blockGroup.value!.children,
        true
      )
      if (intersects.length > 0) {
        if (intersected !== intersects[0].object) {
          if (intersected && intersected?.material) {
            intersected?.material[0]?.emissive?.setHex(intersected.currentHex)
          }
          intersected = intersects[0].object
          intersected.currentHex = intersected?.material[0]?.emissive?.getHex()
          intersected?.material[0]?.emissive?.setHex(0xff0000)
        }
      } else {
        if (intersected)
          intersected?.material[0]?.emissive?.setHex(intersected.currentHex)
        intersected = null
      }
    })
  }
  // 场景重置
  const reset = () => {
    const resetGroup = (group: ShallowRef<THREE.Group>) => {
      group.value.clear()
      scene.value!.remove(group.value)
      group.value = new THREE.Group()
    }
    resetGroup(blockGroup)
    resetGroup(labelGroup)
    resetGroup(borderGroup)
    resetGroup(backgroundGroup)
    renderMixins.value = []
  }
  const bootstrap = async (options: UseMapOptions) => {
    reset()
    params.value = { depth: 0.2, pitch: 45, ...options }
    const { data: geojson } = await axios.get(options.geojson)
    adjustParameter(geojson)
    generateMapGeometry(geojson)
    generateMapTopBorder(geojson)
    generateMapBottonBorder(geojson)
    generateMapLabel(geojson)
    generatePlanes(geojson)
    addListeners()
  }

  return {
    container,
    bootstrap,
  }
}
