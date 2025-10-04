'use client'

import React, { useEffect } from 'react'
import * as THREE from 'three'

const WavesEffect: React.FC = () => {
  useEffect(() => {
    const SEPARATION = 40, AMOUNTX = 130, AMOUNTY = 35
    let container: HTMLDivElement | null
    let camera: THREE.PerspectiveCamera
    let scene: THREE.Scene
    let renderer: THREE.WebGLRenderer
    const particles: THREE.Sprite[] = []
    let particle: THREE.Sprite
    let count = 0

    function init() {
      container = document.getElementById('waves-container') as HTMLDivElement
      if (!container) return

      container.classList.add('waves')

      camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 1, 10000)
      camera.position.y = 150
      camera.position.z = 300
      camera.rotation.x = 0.35

      scene = new THREE.Scene()

      const PI2 = Math.PI * 2
      const material = new THREE.SpriteMaterial({
        color: 0x432389, // Header color
        map: new THREE.CanvasTexture(generateSprite(PI2))
      })

      let i = 0
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          particle = particles[i++] = new THREE.Sprite(material)
          particle.position.x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2
          particle.position.z = iy * SEPARATION - (AMOUNTY * SEPARATION) - 10
          scene.add(particle)
        }
      }

      renderer = new THREE.WebGLRenderer({ alpha: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000, 0) // transparent
      container.appendChild(renderer.domElement)

      window.addEventListener('resize', onWindowResize, false)
    }

    function generateSprite(PI2: number) {
      const canvas = document.createElement('canvas')
      canvas.width = 16
      canvas.height = 16
      const context = canvas.getContext('2d')

      if (context) {
        context.beginPath()
        context.arc(8, 8, 8, 0, PI2, true)
        context.fillStyle = '#939393' // Header color fill
        context.fill()
      }

      return canvas
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    function animate() {
      requestAnimationFrame(animate)
      render()
    }

    function render() {
      let i = 0
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          particle = particles[i++]
          particle.position.y = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50
          particle.scale.x = particle.scale.y =
            (Math.sin((ix + count) * 0.3) + 1) * 4 + (Math.sin((iy + count) * 0.5) + 1) * 4
        }
      }
      renderer.render(scene, camera)
      count += 0.05
    }

    init()
    animate()
  }, [])

  return <div id="waves-container" className="waves-container" />
}

export default WavesEffect;