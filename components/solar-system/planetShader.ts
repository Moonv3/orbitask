export const planetVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vObjectPosition;
  varying vec3 vViewDirection;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vObjectPosition = position;
    vViewDirection = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const planetFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uCompleted;
  uniform float uComet;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vObjectPosition;
  varying vec3 vViewDirection;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += noise(p) * amplitude;
      p *= 2.07;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 lightDir = normalize(-vWorldPosition);
    float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
    float night = smoothstep(0.0, 0.45, diffuse);

    // Slow procedural cloud bands, unique per planet because they sample the
    // object-space position.
    float bands = sin(
      vObjectPosition.y * 13.0 +
      fbm(vObjectPosition * 2.4 + vec3(0.0, uTime * 0.02, 0.0)) * 4.5
    );
    bands = bands * 0.5 + 0.5;

    float swirl = fbm(
      vObjectPosition * 4.2 + vec3(uTime * 0.035, uTime * 0.012, 0.0)
    );

    vec3 deep = uColor * 0.24;
    vec3 mid = mix(uColor, vec3(1.0), 0.1);
    vec3 surface = mix(deep, mid, 0.42 + bands * 0.34 + swirl * 0.24);
    surface *= 0.34 + diffuse * 0.98;

    // A thin atmospheric rim, strongest where the planet meets the darkness.
    float rim = pow(
      1.0 - clamp(dot(normal, normalize(vViewDirection)), 0.0, 1.0),
      2.6
    );
    surface += uColor * rim * (0.12 + diffuse * 0.24);

    // Overdue planets burn orange, like a comet falling toward the sun.
    vec3 cometTint = vec3(1.0, 0.4, 0.14);
    surface = mix(surface, cometTint * (0.22 + diffuse * 1.05), uComet * 0.62);

    // Completed planets glow softly, with a slow heartbeat.
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
    surface += vec3(0.32, 1.0, 0.84) * uCompleted * (0.08 + pulse * 0.16);

    // Night side is never pure black: a cool ambient keeps the silhouette.
    surface += vec3(0.02, 0.03, 0.06) * (1.0 - night);

    gl_FragColor = vec4(surface, 1.0);
  }
`;
