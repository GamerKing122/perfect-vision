import { Board } from "../board.js";
import { patch } from "../../utils/patch.js";

Hooks.once("init", () => {
    patch("TemplateLayer.layerOptions", "POST", function (options) {
        return mergeObject(options, {
            zIndex: SightLayer.layerOptions.zIndex + 50
        });
    });

    patch("MeasuredTemplate.prototype.draw", "POST", async function (result) {
        await result;

        Board.place(`MeasuredTemplate#${this.id}.template`, this.id && !this._original && this.parent !== canvas.templates.preview ? this.template : null, Board.LAYERS.TEMPLATES, function () { return this.parent?.zIndex ?? 0; });

        return this;
    });

    patch("MeasuredTemplate.prototype.destroy", "PRE", function () {
        Board.unplace(`MeasuredTemplate#${this.id}.template`);

        return arguments;
    });
});
