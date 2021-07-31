import { Board } from "../../core/board.js";
import { patch } from "../../utils/patch.js";

Hooks.once("init", () => {
    if (!game.modules.get("splatter")?.active) {
        return;
    }

    patch("BloodSplatter.prototype.Update", "POST", function () {
        setTimeout(() => {
            if (canvas.background.BloodSplatter === this) {
                Board.place("splatter.blood", this.blood, "background+2");
            }
        }, 0);
    });

    patch("BloodSplatter.prototype.Destroy", "PRE", function () {
        Board.unplace("splatter.blood");

        return arguments;
    });
});