import { describe, it, expect } from 'vitest';
import { Unit } from './Unit';
import { Units } from './Units';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const gram = new Unit(BigInt(1), 'gram', 'g', null, 1);
const kilogram = new Unit(BigInt(2), 'kilogram', 'kg', gram, 1000);
const millilitre = new Unit(BigInt(3), 'millilitre', 'ml', null, 1);

// ---------------------------------------------------------------------------
// Unit
// ---------------------------------------------------------------------------

describe('Unit', () => {

    describe('constructor', () => {
        it('assigns all properties', () => {
            const unit = new Unit(BigInt(1), 'gram', 'g', null, 1);
            expect(unit.id).toBe(BigInt(1));
            expect(unit.name).toBe('gram');
            expect(unit.abbreviation).toBe('g');
            expect(unit.base).toBeNull();
            expect(unit.baseFactor).toBe(1);
        });

        it('stores a base unit reference', () => {
            expect(kilogram.base).toBe(gram);
            expect(kilogram.baseFactor).toBe(1000);
        });

        it('is immutable', () => {
            const unit = new Unit(BigInt(1), 'gram', 'g', null, 1);
            expect(() => { (unit as unknown as Record<string, unknown>).name = 'litre'; }).toThrow();
        });
    });

    describe('fromJson', () => {
        it('creates a Unit from a plain JSON object', () => {
            const json = { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 };
            const unit = Unit.fromJson(json);
            expect(unit).toBeInstanceOf(Unit);
            expect(unit.id).toBe(BigInt(1));
            expect(unit.name).toBe('gram');
            expect(unit.abbreviation).toBe('g');
            expect(unit.base).toBeNull();
            expect(unit.baseFactor).toBe(1);
        });

        it('preserves the base reference from JSON', () => {
            const baseJson = { id: BigInt(1), name: 'gram', abbreviation: 'g', base: null, baseFactor: 1 };
            const json = { id: BigInt(2), name: 'kilogram', abbreviation: 'kg', base: baseJson, baseFactor: 1000 };
            const unit = Unit.fromJson(json);
            expect(unit.base).toBe(baseJson);
            expect(unit.baseFactor).toBe(1000);
        });
    });
});

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

describe('Units', () => {

    describe('constructor', () => {
        it('stores the provided units array', () => {
            const units = new Units([gram, kilogram]);
            expect(units.units).toEqual([gram, kilogram]);
        });

        it('is immutable', () => {
            const units = new Units([gram]);
            expect(() => { (units as unknown as Record<string, unknown>).units = []; }).toThrow();
        });
    });

    describe('getUnit', () => {
        const units = new Units([gram, kilogram, millilitre]);

        it('returns the correct unit by bigint id', () => {
            expect(units.getUnit(BigInt(1))).toBe(gram);
            expect(units.getUnit(BigInt(2))).toBe(kilogram);
            expect(units.getUnit(BigInt(3))).toBe(millilitre);
        });

        it('returns the correct unit by string id', () => {
            expect(units.getUnit('1')).toBe(gram);
            expect(units.getUnit('2')).toBe(kilogram);
            expect(units.getUnit('3')).toBe(millilitre);
        });

        it('throws when no unit matches a bigint id', () => {
            expect(() => units.getUnit(BigInt(99))).toThrow('Unit with id 99 not found');
        });

        it('throws when no unit matches a string id', () => {
            expect(() => units.getUnit('99')).toThrow('Unit with id 99 not found');
        });
    });

    describe('getFirst', () => {
        it('returns the first unit in the collection', () => {
            const units = new Units([gram, kilogram, millilitre]);
            expect(units.getFirst()).toBe(gram);
        });

        it('returns the only unit in a single-item collection', () => {
            const units = new Units([millilitre]);
            expect(units.getFirst()).toBe(millilitre);
        });
    });
});
