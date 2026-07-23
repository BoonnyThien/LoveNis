precision highp float;

uniform vec3 uColor;
varying float vAlpha;
varying vec3 vColor;
varying float vDistance;

void main() {
  // Create circular particle with soft edges
  vec2 centroid = gl_PointCoord - vec2(0.5);
  float dist = length(centroid);
  
  if (dist > 0.5) discard;  // Circular falloff
  
  // Glow effect based on distance from center of particle
  float glow = exp(-dist * dist * 5.0);
  
  // Mix color with glow and apply alpha
  gl_FragColor = vec4(vColor * glow, vAlpha * glow);
}
