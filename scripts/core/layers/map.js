import { Board } from "../board.js";
import { patch } from "../../utils/patch.js";
import { Tiles } from "../tiles.js";

Hooks.once("init", () => {
    patch("MapLayer.layerOptions", "POST", function (options) {
        return mergeObject(options, {
            zIndex: SightLayer.layerOptions.zIndex - 50
        });
    });

    patch("MapLayer.prototype.getZIndex", "OVERRIDE", function () {
        const zIndex = PlaceablesLayer.prototype.getZIndex.call(this);

        if (this._active) {
            return zIndex + 100;
        }

        return zIndex;
    });

    patch("MapLayer.prototype.draw", "POST", async function (result) {
        await result;

        Board.place(`${this.options.name}.bg`, this.bg, this.options.name);

        return this;
    });

    patch("MapLayer.prototype.tearDown", "WRAPPER", async function (wrapped, ...args) {
        Board.unplace(`${this.options.name}.bg`);

        return await wrapped(...args);
    });

    patch("Tile.prototype.draw", "POST", async function (result) {
        await result;

        if (this.tile) {
            if (Tiles.isOverhead(this)) {
                Board.place(this.document?.uuid, !this._original ? this.tile : null, "foreground-1");
            } else {
                Board.place(this.document?.uuid, !this._original ? this.tile : null, "background+1");
            }
        }

        if (this.occlusionFilter) {
            this.occlusionFilter.enabled = false;

            const index = this.tile.filters.indexOf(this.occlusionFilter);

            if (index >= 0) {
                this.tile.filters.splice(index, 1);
            }

            if (this.tile.filters.length === 0) {
                this.tile.filters = null;
            }
        }

        return this;
    });

    patch("Tile.prototype.refresh", "POST", function () {
        if (this.tile) {
            this.tile.mask = Tiles.getOcclusionMask(this);
        }

        return this;
    });

    patch("Tile.prototype.destroy", "PRE", function () {
        Board.unplace(this.document.uuid);

        return arguments;
    });
});