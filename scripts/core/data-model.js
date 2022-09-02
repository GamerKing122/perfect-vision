import { parseColor } from "../utils/helpers.js";
import { LightingRegion, LightingSystem } from "./lighting-system.js";

class LightingRegionData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            fit: new fields.BooleanField({
                required: false,
                initial: false
            }),
            prototype: new fields.StringField({
                required: false,
                nullable: true,
                initial: null,
                blank: false
            }),
            fogExploration: new fields.BooleanField({
                required: false,
                initial: true
            }),
            fogRevealed: new fields.BooleanField({
                required: false,
                initial: false
            }),
            visionLimitation: new fields.EmbeddedDataField(VisionLimitationData, {
                required: false
            }),
            globalLight: new fields.EmbeddedDataField(GlobalLightData, {
                required: false
            }),
            darkness: new fields.AlphaField({
                required: false,
                initial: 0
            }),
            daylightColor: new fields.ColorField({
                required: false
            }),
            darknessColor: new fields.ColorField({
                required: false
            })
        };
    }
}

class VisionLimitationData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        const rangeField = () => new fields.NumberField({
            required: false,
            nullable: true,
            initial: null,
            min: 0,
            step: 0.01
        });
        return {
            enabled: new fields.BooleanField({
                required: false,
                initial: false
            }),
            sight: rangeField(),
            sound: rangeField(),
            move: rangeField(),
            other: rangeField(),
            detection: new fields.SchemaField(
                Object.fromEntries(Object.values(CONFIG.Canvas.detectionModes)
                    .map(mode => [mode.id, rangeField({ label: mode.label })])
                ),
                {
                    required: false
                }
            )
        };
    }
}

class GlobalLightData extends foundry.abstract.DataModel {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        let schema = LightingSystem.getDefaultData().globalLight;
        const lightSchema = foundry.data.LightData.defineSchema();

        for (const name in schema) {
            if (name in lightSchema) {
                schema[name] = lightSchema[name];
            }
        }

        schema.enabled = new fields.BooleanField({
            required: false,
            nullable: false,
            initial: false
        });
        schema.x = new fields.NumberField({
            required: false,
            nullable: false,
            initial: 0,
            integer: true
        });
        schema.y = new fields.NumberField({
            required: false,
            nullable: false,
            initial: 0,
            integer: true
        });
        schema.bright = new fields.BooleanField({
            required: false,
            nullable: false,
            initial: false
        });
        schema.vision = new fields.BooleanField({
            required: false,
            nullable: false,
            initial: false
        });
        schema.resolution = new fields.NumberField({
            required: false,
            nullable: false,
            initial: 1,
            min: 0,
            positive: true
        });
        schema.seed = new fields.NumberField({
            required: false,
            nullable: false,
            initial: 0
        });

        const unrequire = fields => {
            for (const field of fields) {
                field.required = false;

                if (field instanceof foundry.data.fields.SchemaField) {
                    unrequire(Object.values(field.fields));
                }
            }
        };

        unrequire(Object.values(schema));

        return schema;
    }
}

function prepareVisionLimitationData(data, dimensions) {
    const unitsToPixels = dimensions.size / dimensions.distance;
    const convertUnitsToPixels = range => Number.isFinite(range)
        ? Math.max(range, 0) * unitsToPixels : Infinity;

    if (data.sight !== undefined) {
        data.sight = convertUnitsToPixels(data.sight);
    }

    if (data.sound !== undefined) {
        data.sound = convertUnitsToPixels(data.sound);
    }

    if (data.move !== undefined) {
        data.move = convertUnitsToPixels(data.move);
    }

    if (data.other !== undefined) {
        data.other = convertUnitsToPixels(data.other);
    }

    data.detection ??= {};

    for (const detectionMode of Object.values(CONFIG.Canvas.detectionModes)) {
        let limit = data.detection[detectionMode.id];

        if (limit !== undefined) {
            data.detection[detectionMode.id] = convertUnitsToPixels(limit);
        }
    }

    return data;
}

export function extractVisionLimitationData(document) {
    const flags = document.flags["perfect-vision"];
    const data = new VisionLimitationData(
        foundry.utils.deepClone(document instanceof AmbientLightDocument
            ? flags?.visionLimitation
            : flags?.light?.visionLimitation),
        { strict: false }).toObject();

    return prepareVisionLimitationData(data, document.parent.dimensions);
}

export function extractLightingData(document) {
    const flags = document.flags["perfect-vision"] ?? {};
    const data = foundry.utils.mergeObject(
        LightingRegion.getDefaultData(),
        foundry.utils.filterObject(
            new LightingRegionData(
                foundry.utils.deepClone(flags),
                { strict: false }
            ).toObject(),
            flags
        )
    );

    let dimensions;

    if (document instanceof Scene) {
        dimensions = document.dimensions;

        data.active = true;
        data.object = null;
        data.prototype = null;
        data.shape = { width: dimensions.width, height: dimensions.height };
        data.fit = false;
        data.elevation = -Infinity;
        data.sort = -Infinity;
        data.fogExploration = document.fogExploration;
        data.globalLight.enabled = document.globalLight;
        data.globalLight.darkness.max = document.globalLightThreshold ?? 1;
    } else {
        dimensions = document.parent.dimensions;

        const { x, y, rotation, shape: { width, height, type, points }, bezierFactor, elevation, sort } = document;

        delete data.active;
        data.object = document.rendered ? document.object : null;
        data.prototype = data.prototype ? `Drawing.${data.prototype}` : "Scene";
        data.shape = { x, y, width, height, rotation, points, bezierFactor, type };
        data.elevation = elevation;
        data.sort = sort;
    }

    data.visionLimitation = prepareVisionLimitationData(data.visionLimitation, dimensions);

    if (data.globalLight.color !== undefined) {
        data.globalLight.color = parseColor(data.globalLight.color)?.valueOf() ?? null;
    }

    if (data.daylightColor !== undefined) {
        data.daylightColor = parseColor(data.daylightColor)?.valueOf() ?? null;
    }

    if (data.darknessColor !== undefined) {
        data.darknessColor = parseColor(data.darknessColor)?.valueOf() ?? null;
    }

    return data;
}