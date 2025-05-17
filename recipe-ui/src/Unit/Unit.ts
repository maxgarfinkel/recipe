import {JsonUnit} from "../Types.ts";

export class Unit implements JsonUnit{
    id!: bigint;
    name!: string;
    abbreviation!: string;
    base!: Unit | null;
    baseFactor!: number;

    constructor(id: bigint, name: string, abbreviation: string, base: Unit | null, baseFactor: number) {
        this.id = id;
        this.name = name;
        this.abbreviation = abbreviation;
        this.base = base;
        this.baseFactor = baseFactor;
        Object.freeze(this);
    }

    public static fromJson(json: JsonUnit): Unit {
        return new Unit(json.id, json.name, json.abbreviation, json.base, json.baseFactor);
    }
}