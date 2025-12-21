import * as THREE from "three"

// Function to generate equally distributed points on a plane
function getPlane(count: number, components: number, size = 512, scale = 1.0) {
  const length = count * components
  const data = new Float32Array(length)

  for (let i = 0; i < count; i++) {
    const i4 = i * components
    const x = (i % size) / (size - 1)
    const z = Math.floor(i / size) / (size - 1)
    data[i4 + 0] = (x - 0.5) * 2 * scale
    data[i4 + 1] = 0
    data[i4 + 2] = (z - 0.5) * 2 * scale
    data[i4 + 3] = 1.0
  }

  return data
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D positions;
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseIntensity;
uniform float uTimeScale;
uniform float uLoopPeriod;
varying vec2 vUv;

float periodicNoise(vec3 p, float time) {
  float noise = 0.0;
  noise += sin(p.x * 2.0 + time) * cos(p.z * 1.5 + time);
  noise += sin(p.x * 3.2 + time * 2.0) * cos(p.z * 2.1 + time) * 0.6;
  noise += sin(p.x * 1.7 + time) * cos(p.z * 2.8 + time * 3.0) * 0.4;
  noise += sin(p.x * p.z * 0.5 + time * 2.0) * 0.3;
  return noise * 0.3;
}

void main() {
  vec3 originalPos = texture2D(positions, vUv).rgb;
  float continuousTime = uTime * uTimeScale * (6.28318530718 / uLoopPeriod);
  vec3 noiseInput = originalPos * uNoiseScale;
  float displacementX = periodicNoise(noiseInput + vec3(0.0, 0.0, 0.0), continuousTime);
  float displacementY = periodicNoise(noiseInput + vec3(50.0, 0.0, 0.0), continuousTime + 2.094);
  float displacementZ = periodicNoise(noiseInput + vec3(0.0, 50.0, 0.0), continuousTime + 4.188);
  vec3 distortion = vec3(displacementX, displacementY, displacementZ) * uNoiseIntensity;
  vec3 finalPos = originalPos + distortion;
  gl_FragColor = vec4(finalPos, 1.0);
}
`

export class SimulationMaterial extends THREE.ShaderMaterial {
  constructor(scale = 10.0) {
    const positionsTexture = new THREE.DataTexture(
      getPlane(512 * 512, 4, 512, scale),
      512,
      512,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    positionsTexture.needsUpdate = true

    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        positions: { value: positionsTexture },
        uTime: { value: 0 },
        uNoiseScale: { value: 1.0 },
        uNoiseIntensity: { value: 0.5 },
        uTimeScale: { value: 1 },
        uLoopPeriod: { value: 24.0 },
      },
    })
  }
}
