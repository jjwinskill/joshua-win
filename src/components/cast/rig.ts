// The shared legs' measurements, in the units of a cast member's viewBox, as in docs/demo/parade.html.
// CastFigure draws from these and the template sheet prints from them, so a drawn body meets the legs.
export const RIG = {
  width: 40,
  height: 47,
  hipY: 33,
  kneeY: 39.5,
  ankleY: 45.5,
  footLength: 3.4,
  frontLegX: 17,
  backLegX: 23,
  // The point the torso turns around when it bows.
  torsoPivotX: 20,
  strokeWidth: 1.8,
} as const;
