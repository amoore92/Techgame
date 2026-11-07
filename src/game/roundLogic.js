export const PERSON_KEYS = [
    'Man_1', 'Man_2', 'Man_3', 'Man_4', 'Man_5', 'Man_6',
    'Woman_1', 'Woman_2', 'Woman_3', 'Woman_4', 'Woman_5', 'Woman_6',
    'Woman_Pregnant_1', 'Woman_Pregnant_2',
];

export function freshProgress ()
{
    return { picked: false, indications: null, sideEffects: null, warnings: null };
}

export function isRoundComplete (progress)
{
    return !!(progress && progress.picked
        && progress.indications && progress.sideEffects && progress.warnings);
}

export function toLines(text) {
    return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
}


export function parseTemplate(templateText) {
    return toLines(templateText).filter(line => line.includes('NAME') && line.includes('DRUG'));
}

export function parseNames(nameText) {
    const firstNames = [];
    const lastNames = [];
    for (const line of toLines(nameText)) {
        const [first, last] = line.split(',').map(part => part.trim());
        if (first) firstNames.push(first);
        if (last) lastNames.push(last);
    }
    return { firstNames, lastNames };
}

export function parseCsvLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            //  Doubled "" inside a quoted field = a literal quote.
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields.map(f => f.trim());
}

export function parseDrugs(drugText) {
    const lines = toLines(drugText);
    const rows = lines[0] && lines[0].startsWith('Generic Name') ? lines.slice(1) : lines;
    return rows.map(line => {
        const [generic, brand, drugClass, indications, sideEffects, warnings] = parseCsvLine(line);
        return { generic, brand, drugClass, indications, sideEffects, warnings };
    }).filter(d => d.generic && d.brand);
}

export function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function eligibleDistractorDrugs(drugs, answerDrug) {
    return drugs.filter(d =>
        d.drugClass !== answerDrug.drugClass && d.generic !== answerDrug.generic);
}

export function buildOptions(field, answerDrug, eligible) {
    const correct = answerDrug[field];
    const seen = new Set([correct]);
    const distractors = [];
    const shuffled = shuffle(eligible);

    for (let i = 0; i < shuffled.length && distractors.length < 4; i++) {
        const value = shuffled[i][field];

        if (value && !seen.has(value)) {
            seen.add(value);
            distractors.push(value);
        }
    }
    return {
        correct,
        options: shuffle([correct, ...distractors])
    };
}

    export function makeRound(pools) {
    const { templates, names, drugs } = pools;
    const drug = pick(drugs);
    const firstName = pick(names.firstNames);
    const lastName = pick(names.lastNames);
    const patientName = `${firstName} ${lastName}`;
    const shownField = pick(['generic', 'brand', 'drugClass']);
    const shownValue = drug[shownField];
    const template = pick(templates);
    const greetingText = template
        .replaceAll('NAME', patientName)
        .replaceAll('DRUG', shownValue);
    let answerField;
    if (shownField === 'generic') {
        answerField = 'brand';
    } else if (shownField === 'brand') {
        answerField = 'generic';
    } else {
        answerField = pick(['generic', 'brand']);
    }
    const drugCorrect = drug[answerField];
    const eligible = eligibleDistractorDrugs(drugs, drug);
    const personKey = pick(PERSON_KEYS);
    const drugOptions = buildOptions(answerField, drug, eligible);
    const indicationOptions = buildOptions('indications', drug, eligible);
    const sideEffectOptions = buildOptions('sideEffects', drug, eligible);
    const warningOptions = buildOptions('warnings', drug, eligible);
    const round = {
        drug,
        shownField,
        shownValue,
        patientName,
        greetingText,
        personKey,
        answerField,
        drugCorrect,
        drugOptions,
        indicationOptions,
        sideEffectOptions,
        warningOptions
    };

    return round;
}
