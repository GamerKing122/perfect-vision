Hooks.once("setup", () => {
    if (game.settings.get("core", "noCanvas")) {
        return;
    }

    function updateGMVision() {
        if (game.user.isGM && canvas.effects.visionSources.size === 0 && game.settings.get("perfect-vision", "improvedGMVision")) {
            canvas.effects.illumination.filter.uniforms.brightnessBoost = game.settings.get("perfect-vision", "improvedGMVisionBrightness");
        } else {
            canvas.effects.illumination.filter.uniforms.brightnessBoost = 0;
        }
    }

    game.settings.register("perfect-vision", "improvedGMVision", {
        name: "Improved GM Vision",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
        onChange: value => {
            if (!canvas.ready || !game.user.isGM) {
                return;
            }

            updateGMVision();

            if (ui.controls.control.name === "lighting") {
                ui.controls.control.tools.find(tool => tool.name === "perfect-vision.improvedGMVision").active = value;
                ui.controls.render();
            }
        }
    });

    game.settings.register("perfect-vision", "improvedGMVisionBrightness", {
        name: "Improved GM Vision Brightness",
        scope: "client",
        config: false,
        type: Number,
        default: 0.25,
        onChange: value => {
            if (!canvas.ready || !game.user.isGM) {
                return;
            }

            updateGMVision();
        }
    });

    game.settings.register("perfect-vision", "delimiters", {
        name: "Delimiters",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
        onChange: value => {
            if (!canvas.ready || !game.user.isGM) {
                return;
            }

            canvas.perception.update({ refreshLighting: true }, true);

            if (ui.controls.control.name === "lighting") {
                ui.controls.control.tools.find(tool => tool.name === "perfect-vision.delimiters").active = value;
                ui.controls.render();
            }
        }
    });

    game.settings.set("perfect-vision", "improvedGMVision", false);
    game.settings.set("perfect-vision", "improvedGMVisionBrightness", 0.25);
    game.settings.set("perfect-vision", "delimiters", false);

    Hooks.once("canvasInit", () => {
        if (!game.user.isGM) {
            return;
        }

        Hooks.on("drawEffectsCanvasGroup", effects => {
            if (game.settings.get("perfect-vision", "improvedGMVision")) {
                effects.illumination.filter.uniforms.brightnessBoost = game.settings.get("perfect-vision", "improvedGMVisionBrightness");
            } else {
                effects.illumination.filter.uniforms.brightnessBoost = 0;
            }
        });

        Hooks.on("sightRefresh", () => {
            updateGMVision();
        });
    });
});
