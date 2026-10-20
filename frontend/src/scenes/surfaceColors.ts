/** Display-only color encoding for the *source* FAFB tissue surface.
 *
 * Hue represents relative position along the original mesh's local Z axis,
 * NEVER an anatomical region, neuron class, physiology or tissue composition.
 * Source XYZ, normals, triangle indices and topology are unchanged.
 */
import * as THREE from 'three'

const back = new THREE.Color('#7764ca')
const middle = new THREE.Color('#49c2d8')
const front = new THREE.Color('#f1d6a7')

export function applySourceDepthColors(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position')
  if (!position || position.itemSize !== 3 || position.count < 3) {
    throw new Error('Source mesh is missing valid vertex coordinates')
  }
  geometry.computeBoundingBox()
  if (!geometry.boundingBox) throw new Error('Source mesh has no depth bounds')
  const low = geometry.boundingBox.min.z
  const high = geometry.boundingBox.max.z
  const span = high - low
  if (!Number.isFinite(span) || span <= 0) {
    throw new Error('Source mesh has no finite nonzero Z span')
  }
  const colors = new Float32Array(position.count * 3)
  const temporary = new THREE.Color()
  for (let index = 0; index < position.count; index++) {
    const fraction = THREE.MathUtils.clamp((position.getZ(index) - low) / span, 0, 1)
    if (fraction <= 0.5) temporary.copy(back).lerp(middle, fraction * 2)
    else temporary.copy(middle).lerp(front, (fraction - 0.5) * 2)
    colors[index * 3] = temporary.r
    colors[index * 3 + 1] = temporary.g
    colors[index * 3 + 2] = temporary.b
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}
