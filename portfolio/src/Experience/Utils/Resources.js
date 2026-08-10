import { TextureLoader, CubeTextureLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'

// Chargeur centralise des assets. Meme famille de loaders qu'igloo.inc :
// GLTF compresse en DRACO (geometrie) + textures KTX2 (basis) pour un poids
// minimal. Emet 'progress' pendant le chargement puis 'ready' a la fin.
//
// `sources` est un tableau d'objets : { name, type, path }
// type ∈ 'gltfModel' | 'texture' | 'cubeTexture' | 'ktx2Texture'
export default class Resources extends EventEmitter {
  constructor(sources) {
    super()
    this.experience = new Experience()

    this.sources = sources
    this.items = {} // assets charges, indexes par name
    this.toLoad = sources.length
    this.loaded = 0

    this.setLoaders()

    // Rien a charger : on signale 'ready' au prochain tick pour laisser
    // les listeners s'abonner d'abord.
    if (this.toLoad === 0) {
      queueMicrotask(() => this.trigger('ready'))
      return
    }

    this.startLoading()
  }

  setLoaders() {
    this.loaders = {}

    // Chemins des decodeurs servis depuis /public (voir README).
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')

    this.ktx2Loader = new KTX2Loader()
    this.ktx2Loader.setTranscoderPath('/basis/')

    this.loaders.gltfLoader = new GLTFLoader()
    this.loaders.gltfLoader.setDRACOLoader(this.dracoLoader)
    this.loaders.gltfLoader.setKTX2Loader(this.ktx2Loader)

    this.loaders.textureLoader = new TextureLoader()
    this.loaders.cubeTextureLoader = new CubeTextureLoader()
  }

  // Le KTX2Loader a besoin du renderer pour detecter le format supporte.
  // Appele par le Renderer une fois son backend (WebGPU/WebGL2) initialise.
  detectKTX2Support(renderer) {
    this.ktx2Loader.detectSupport(renderer)
  }

  startLoading() {
    for (const source of this.sources) {
      switch (source.type) {
        case 'gltfModel':
          this.loaders.gltfLoader.load(source.path, (file) => this.onLoad(source, file))
          break
        case 'texture':
          this.loaders.textureLoader.load(source.path, (file) => this.onLoad(source, file))
          break
        case 'cubeTexture':
          this.loaders.cubeTextureLoader.load(source.path, (file) => this.onLoad(source, file))
          break
        case 'ktx2Texture':
          this.ktx2Loader.load(source.path, (file) => this.onLoad(source, file))
          break
        default:
          console.warn(`Resources: type inconnu "${source.type}" pour "${source.name}"`)
      }
    }
  }

  onLoad(source, file) {
    this.items[source.name] = file
    this.loaded += 1
    this.trigger('progress', [this.loaded / this.toLoad])

    if (this.loaded === this.toLoad) {
      this.trigger('ready')
    }
  }
}
