import { extractLightingData } from "./data-model.js";
import { LightingSystem } from "./lighting-system.js";
import { parseColor } from "../utils/helpers.js";

Hooks.once("setup", () => {
    if (game.settings.get("core", "noCanvas")) {
        return;
    }

    libWrapper.register(
        "perfect-vision",
        "CONFIG.Canvas.colorManager.prototype.initialize",
        function (wrapped, colors = {}) {
            const flags = canvas.scene.flags["perfect-vision"];

            colors.daylightColor = parseColor(flags?.daylightColor, colors.daylightColor ?? CONFIG.Canvas.daylightColor).maximize(0.05);
            colors.darknessColor = parseColor(flags?.darknessColor, colors.darknessColor ?? CONFIG.Canvas.darknessColor).maximize(0.05);

            const result = wrapped(colors);

            if (LightingSystem.instance.hasRegion("globalLight")) {
                LightingSystem.instance.updateRegion("globalLight", {
                    darkness: this.darknessLevel,
                    lightLevels: this.weights,
                    daylightColor: this.colors.ambientDaylight.valueOf(),
                    darknessColor: this.colors.ambientDarkness.valueOf(),
                    brightestColor: this.colors.ambientBrightest.valueOf()
                });
            }

            return result;
        },
        libWrapper.WRAPPER
    );

    if (game.modules.get("levels")?.active) {
        Hooks.on("createEffectsCanvasGroup", () => {
            let visible;

            canvas.app.ticker.add(function () {
                if (visible !== canvas.primary.background?.visible) {
                    visible = canvas.primary.background?.visible;

                    if (LightingSystem.instance.hasRegion("globalLight")
                        && LightingSystem.instance.updateRegion("globalLight", {
                            occluded: !visible
                        })) {
                        canvas.perception.update({ refreshLighting: true }, true);
                    }
                }
            }, globalThis, PIXI.UPDATE_PRIORITY.HIGH + 1);
        });
    }

    Hooks.on("drawEffectsCanvasGroup", () => {
        updateLighting({ defer: true });
    });

    Hooks.on("updateScene", document => {
        if (!document.isView) {
            return;
        }

        updateLighting();
    });

    Hooks.on("updateScene", document => {
        if (!document.isView) {
            return;
        }

        updateLighting();
    });
});

export function updateLighting({ defer = false } = {}) {
    let initializeLighting = false;
    const data = extractLightingData(canvas.scene);

    if (game.modules.get("levels")?.active) {
        data.occluded = !canvas.primary.background.visible;
        data.occlusionMode = CONST.TILE_OCCLUSION_MODES.FADE;
    }

    if (!LightingSystem.instance.hasRegion("globalLight")) {
        LightingSystem.instance.createRegion("globalLight", data);

        initializeLighting = true;
    } else if (!LightingSystem.instance.updateRegion("globalLight", data)) {
        defer = true;
    }

    canvas.colorManager.initialize();

    if (!defer) {
        canvas.perception.update({ initializeLighting, refreshLighting: true }, true);
    }
};
