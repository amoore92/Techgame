//  Unit tests for the round-generation component of roundLogic.js
//  Component under test: makeRound, buildOptions, eligibleDistractorDrugs, shuffle
//  Each test name starts with its QMP test-case ID for traceability.
//
//  Run:  npx vitest run
//
//  Tests marked "EXPECTED FAIL (defect)" check the behavior the specification asks
//  for (an error on invalid input). The current code does not throw there, so these
//  tests fail on purpose and document the defect.

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    makeRound,
    buildOptions,
    eligibleDistractorDrugs,
    shuffle,
} from './roundLogic.js';

// ---------------------------------------------------------------------------
//  Test data ("shown in test file")
//  Six drugs, each with a different class and different values in every field,
//  so any one of them has 5 eligible distractor drugs.
// ---------------------------------------------------------------------------
const DRUGS = [
    {
        generic: 'warfarin', brand: 'Coumadin',
        drugClass: 'Vitamin K antagonist anticoagulant',
        indications: 'Prevent blood clots',
        sideEffects: 'Bleeding, bruising',
        warnings: 'Avoid sudden changes in vitamin K intake',
    },
    {
        generic: 'lisinopril', brand: 'Zestril',
        drugClass: 'ACE inhibitor',
        indications: 'High blood pressure',
        sideEffects: 'Dry cough, dizziness',
        warnings: 'Can cause angioedema',
    },
    {
        generic: 'atorvastatin', brand: 'Lipitor',
        drugClass: 'HMG-CoA reductase inhibitor (statin)',
        indications: 'High cholesterol',
        sideEffects: 'Muscle pain',
        warnings: 'Report unexplained muscle pain',
    },
    {
        generic: 'metformin', brand: 'Glucophage',
        drugClass: 'Biguanide',
        indications: 'Type 2 diabetes',
        sideEffects: 'Nausea, diarrhea',
        warnings: 'Risk of lactic acidosis',
    },
    {
        generic: 'amoxicillin', brand: 'Amoxil',
        drugClass: 'Penicillin antibiotic',
        indications: 'Bacterial infections',
        sideEffects: 'Rash, diarrhea',
        warnings: 'Do not use with a penicillin allergy',
    },
    {
        generic: 'sertraline', brand: 'Zoloft',
        drugClass: 'SSRI antidepressant',
        indications: 'Depression and anxiety',
        sideEffects: 'Nausea, insomnia',
        warnings: 'Watch for suicidal thoughts in young adults',
    },
];

const ANSWER = DRUGS[0];                                    // warfarin
const SHARES_GENERIC = { ...DRUGS[1], generic: ANSWER.generic };     // same generic, other class
const SHARES_CLASS   = { ...DRUGS[1], drugClass: ANSWER.drugClass }; // same class, other generic
const THREE_DRUGS = [ANSWER, SHARES_GENERIC, DRUGS[2]];    // answer, one shared, one unique
const INVALID_OBJECT = { animal: 'cat', age: 3, gender: 'female' };

function makePools (drugs)
{
    return {
        templates: ['Hi, I am NAME and I am here to pick up DRUG.'],
        names: { firstNames: ['Ann', 'Ben'], lastNames: ['Lee', 'Diaz'] },
        drugs,
    };
}

const OPTION_KEYS = ['drugOptions', 'indicationOptions', 'sideEffectOptions', 'warningOptions'];

afterEach(() => vi.restoreAllMocks());

// ===========================================================================
//  Equivalence-class test cases
// ===========================================================================

describe('makeRound(pools) - equivalence classes', () => {
    it('TCECmR01 - one selectable drug: round created with no distractors', () => {
        const round = makeRound(makePools([ANSWER]));
        expect(round.drug).toBe(ANSWER);
        for (const key of OPTION_KEYS) {
            expect(round[key].options).toEqual([round[key].correct]);
        }
    });

    it('TCECmR02 - five or more suitable drugs: four distractors per question', () => {
        const round = makeRound(makePools(DRUGS));
        for (const key of OPTION_KEYS) {
            const { correct, options } = round[key];
            expect(options).toHaveLength(5);
            expect(options).toContain(correct);
            expect(new Set(options).size).toBe(5);       // no duplicate answers
        }
        expect(round.greetingText).not.toMatch(/NAME|DRUG/);
        expect(round.greetingText).toContain(round.patientName);
    });

    it('TCECmR03 - two drugs (insufficient eligible values): fewer than four distractors', () => {
        const round = makeRound(makePools([DRUGS[0], DRUGS[1]]));
        for (const key of OPTION_KEYS) {
            expect(round[key].options.length).toBeLessThan(5);
            expect(round[key].options).toHaveLength(2);
        }
    });

    it('TCECmR04 - failed to read in files (empty pools): error', () => {
        const emptyPools = { templates: [], names: { firstNames: [], lastNames: [] }, drugs: [] };
        expect(() => makeRound(emptyPools)).toThrow();
    });

    it('TCECmR05 - incorrect file read in (incompatible objects): error  [EXPECTED FAIL (defect)]', () => {
        expect(() => makeRound(makePools([INVALID_OBJECT]))).toThrow();
    });
});

describe('buildOptions(field, answerDrug, eligible) - equivalence classes', () => {
    const FOUR_ELIGIBLE = DRUGS.slice(1, 5);

    it('TCECbO01 - valid field, valid answerDrug, 4 eligible: successful generation', () => {
        const result = buildOptions('generic', ANSWER, FOUR_ELIGIBLE);
        expect(result.correct).toBe('warfarin');
        expect(result.options).toHaveLength(5);
        expect([...result.options].sort())
            .toEqual(['amoxicillin', 'atorvastatin', 'lisinopril', 'metformin', 'warfarin']);
    });

    it('TCECbO02 - invalid field "toothpaste": error  [EXPECTED FAIL (defect)]', () => {
        expect(() => buildOptions('toothpaste', ANSWER, FOUR_ELIGIBLE)).toThrow();
    });

    it('TCECbO04 - invalid answerDrug object: error  [EXPECTED FAIL (defect)]', () => {
        expect(() => buildOptions('generic', INVALID_OBJECT, FOUR_ELIGIBLE)).toThrow();
    });

    it('TCECbO05 - empty answerDrug []: error  [EXPECTED FAIL (defect)]', () => {
        expect(() => buildOptions('generic', [], FOUR_ELIGIBLE)).toThrow();
    });

    it('TCECbO07 - fewer than 4 eligible (1 object): no 5-option question', () => {
        const result = buildOptions('generic', ANSWER, [DRUGS[1]]);
        expect(result.options).not.toHaveLength(5);
        expect([...result.options].sort()).toEqual(['lisinopril', 'warfarin']);
    });

    it('TCECbO08 - no eligible objects []: no 5-option question', () => {
        const result = buildOptions('generic', ANSWER, []);
        expect(result).toEqual({ correct: 'warfarin', options: ['warfarin'] });
    });
});

describe('eligibleDistractorDrugs(drugs, answerDrug) - equivalence classes', () => {
    it('TCECeD01 - answerDrug is the only item: empty set returned', () => {
        expect(eligibleDistractorDrugs([ANSWER], ANSWER)).toEqual([]);
    });

    it('TCECeD02 - two items sharing a generic value: empty set returned', () => {
        expect(eligibleDistractorDrugs([ANSWER, SHARES_GENERIC], ANSWER)).toEqual([]);
    });

    it('TCECeD03 - two items sharing a drug class: empty set returned', () => {
        expect(eligibleDistractorDrugs([ANSWER, SHARES_CLASS], ANSWER)).toEqual([]);
    });

    it('TCECeD04 - answer, one shared, one unique: only the unique drug returned', () => {
        expect(eligibleDistractorDrugs(THREE_DRUGS, ANSWER)).toEqual([DRUGS[2]]);
    });

    it('TCECeD06 - invalid answerDrug object: error  [EXPECTED FAIL (defect)]', () => {
        expect(() => eligibleDistractorDrugs(THREE_DRUGS, INVALID_OBJECT)).toThrow();
    });

    it('TCECeD07 - empty answerDrug []: error  [EXPECTED FAIL (defect)]', () => {
        expect(() => eligibleDistractorDrugs(THREE_DRUGS, [])).toThrow();
    });
});

describe('shuffle(array) - equivalence classes', () => {
    it('TCECsh01 - 2 or more items [a, b, c]: shuffled array returned', () => {
        const input = ['a', 'b', 'c'];
        const result = shuffle(input);
        expect(result).toHaveLength(3);
        expect([...result].sort()).toEqual(['a', 'b', 'c']);
        expect(result).not.toBe(input);                   // a new array
        expect(input).toEqual(['a', 'b', 'c']);           // input not changed
    });

    it('TCECsh02 - 1 item [a]: single-item array returned', () => {
        expect(shuffle(['a'])).toEqual(['a']);
    });

    it('TCECsh03 - 0 items []: empty array returned', () => {
        expect(shuffle([])).toEqual([]);
    });

    it('TCECsh04 - not an array (0): error', () => {
        expect(() => shuffle(0)).toThrow();
    });
});

// ===========================================================================
//  Complete-coverage test cases (path coverage)
//  makeRound: Math.random is stubbed so pick() chooses a known shownField.
//  pick(['generic','brand','drugClass']) uses floor(r * 3):
//    r = 0   -> index 0 'generic'
//    r = 0.4 -> index 1 'brand'
//    r = 0.7 -> index 2 'drugClass'
// ===========================================================================

describe('makeRound(pools) - complete coverage', () => {
    it('CCmR01 - force shownField "generic": path 1-11, 12, 13, 17-out', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const round = makeRound(makePools(DRUGS));
        expect(round.shownField).toBe('generic');
        expect(round.answerField).toBe('brand');
        expect(round.drugCorrect).toBe(round.drug.brand);
        expect(round.greetingText).toContain(round.drug.generic);
    });

    it('CCmR02 - force shownField "brand": path 1-11, 12, 14, 15, 17-out', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.4);
        const round = makeRound(makePools(DRUGS));
        expect(round.shownField).toBe('brand');
        expect(round.answerField).toBe('generic');
        expect(round.drugCorrect).toBe(round.drug.generic);
        expect(round.greetingText).toContain(round.drug.brand);
    });

    it('CCmR03 - force shownField "drugClass": path 1-11, 12, 14, 16, 17-out', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.7);
        const round = makeRound(makePools(DRUGS));
        expect(round.shownField).toBe('drugClass');
        expect(['generic', 'brand']).toContain(round.answerField);
        expect(round.drugCorrect).toBe(round.drug[round.answerField]);
        expect(round.greetingText).toContain(round.drug.drugClass);
    });
});

describe('buildOptions(field, answerDrug, eligible) - complete coverage', () => {
    it('CCbO01 - eligible holds a drug equal to answerDrug: path 1-6, 7, 8, 9, 11, 7, 12, out', () => {
        const result = buildOptions('generic', ANSWER, [{ ...ANSWER }]);
        expect(result).toEqual({ correct: 'warfarin', options: ['warfarin'] });
    });
});
