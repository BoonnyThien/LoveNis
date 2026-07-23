attribute float size;
attribute float alpha;
attribute vec3 color;

varying float vAlpha;
varying vec3 vColor;
varying float vDistance;

void main() {
  vAlpha = alpha;
  vColor = color;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  
  // Calculate distance for fade out
  vDistance = -mvPosition.z;
  
  // Size attenuation
  gl_PointSize = size * (1000.0 / vDistance);
  
  gl_Position = projectionMatrix * mvPosition;
}
