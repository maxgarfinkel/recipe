import {Unit} from "./Unit.ts";

export class Units {
    units!: Unit[];

    constructor(units: Unit[]) {
        this.units = units;
        Object.freeze(this)
    }

    getUnit(id: bigint | string): Unit {
        if (typeof id === 'string') {
            id = BigInt(id);
        }
        const unit = this.units.find((unit) => unit.id.toString() === id.toString());
        if (!unit) {
            console.error(this.units);
            throw new Error(`Unit with id ${id} not found`);
        }
        return unit;
    }

    getFirst(): Unit {
        return this.units[0];
    }

}