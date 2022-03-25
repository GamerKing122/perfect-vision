export const { Tess: Tess2 } = await createTess2Wasm();

Object.assign(Tess2, {
    BOUNDARY_CONTOURS: 2,
    CONNECTED_POLYGONS: 1,
    POLYGONS: 0,
    WINDING_ODD: 0,
    WINDING_NONZERO: 1,
    WINDING_POSITIVE: 2,
    WINDING_NEGATIVE: 3,
    WINDING_ABS_GEQ_TWO: 4
});