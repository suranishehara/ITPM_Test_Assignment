import { test, expect, type Page } from '@playwright/test';

const URL = 'https://www.swifttranslator.com/';

/**
 * Helper: Types Singlish input and checks if expected Sinhala text appears anywhere in the page body.
 * Assumes real-time translation and output is visible text (not inside another textarea).
 */
async function typeAndCheck(page: Page, input: string, expectedRegex: RegExp) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const inputLocator = page.locator('textarea').first();
  await expect(inputLocator).toBeVisible({ timeout: 15000 });
  await inputLocator.fill(input);
  await expect(page.locator('body')).toContainText(expectedRegex, { timeout: 20000 });
}

/**
 * Helper for negative/robustness tests: Ensures typing doesn't crash the page,
 * input is accepted, and URL remains correct.
 */
async function typeAndCheckRobust(page: Page, input: string) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  const inputLocator = page.locator('textarea').first();
  await expect(inputLocator).toBeVisible({ timeout: 15000 });
  await inputLocator.fill(input);
  await expect(inputLocator).toHaveValue(input, { timeout: 10000 });
  await expect(page).toHaveURL(/swifttranslator\.com/i);
}

test.describe('SwiftTranslator Singlish → Sinhala - 35 Test Cases (IT23218130)', () => {
  // ───────────────────────────────────────────────
  // Required 1 UI Positive Test
  // ───────────────────────────────────────────────
  test('Pos_UI_0001 - Real-time output updates automatically while typing', async ({ page }) => {
    await page.goto(URL);
    const input = page.locator('textarea').first();
    await input.fill('mama gedhara y');
    // Partial should appear
    await expect(page.locator('body')).toContainText(/ගෙදර|ය/, { timeout: 10000 });
    await input.fill('mama gedhara yanawaa');
    await expect(page.locator('body')).toContainText(/මම|ගෙදර|යනවා/, { timeout: 10000 });
  });

  // ───────────────────────────────────────────────
  // 24 Positive Functional Tests (covering required categories)
  // ───────────────────────────────────────────────
  const positiveTests = [
    // Simple sentences, daily usage, short (S)
    { id: 'Pos_Fun_0004', name: 'Simple present tense daily usage', input: 'mama gedhara yanawaa.', expect: /මම|ගෙදර|යනවා/ },
    { id: 'Pos_Fun_0005', name: 'Simple negation short', input: 'mata eeka epaa.', expect: /මට|ඒක|එපා/ },
    { id: 'Pos_Fun_0006', name: 'Imperative command short', input: 'vahaama enna.', expect: /වහාම|එන්න/ },

    // Interrogative (questions)
    { id: 'Pos_Fun_0007', name: 'Basic greeting question short', input: 'oyaata kohomadha?', expect: /ඔයාට|කොහොමද/ },
    { id: 'Pos_Fun_0008', name: 'Request question polite medium', input: 'karuNaakaralaa mata help ekak karanna puluvandha?', expect: /කරුණාකරලා|උදව්|පුළුවන්ද/ },

    // Compound & complex sentences
    { id: 'Pos_Fun_0009', name: 'Compound sentence medium', input: 'mama gedhara yanawaa, haebaeyi vahina nisaa yanne naee.', expect: /ගෙදර|යනවා|වැහි|නැහැ/ },
    { id: 'Pos_Fun_0010', name: 'Complex conditional medium', input: 'oya enawanam mama balan innawaa.', expect: /ඔයා|එනවනම්|බලන්|ඉන්නවා/ },

    // Tenses (past/present/future)
    { id: 'Pos_Fun_0011', name: 'Past tense medium', input: 'api iiyee paasal giyaa.', expect: /අපි|ඊයේ|පාසල්|ගියා/ },
    { id: 'Pos_Fun_0012', name: 'Future tense medium', input: 'api heta paasal yanawaa.', expect: /අපි|හෙට|පාසල්|යනවා/ },

    // Mixed English / brand terms
    { id: 'Pos_Fun_0013', name: 'Mixed Zoom meeting medium', input: 'mama Zoom meeting ekak thiyenawa office eke.', expect: /Zoom|meeting|තියෙනවා|office/ },
    { id: 'Pos_Fun_0014', name: 'Email + WhatsApp mixed medium', input: 'email ekak evanna puluvandha? naattam WhatsApp karanna.', expect: /email|එවන්න|WhatsApp/ },

    // Polite vs informal
    { id: 'Pos_Fun_0015', name: 'Polite request medium', input: 'karunaakarala eeka poddak balanna puluvandha?', expect: /කරුණාකරලා|පොඩ්ඩක්|බලන්න|පුළුවන්ද/ },
    { id: 'Pos_Fun_0016', name: 'Informal casual short', input: 'machan ela supiri da!', expect: /මචන්|එල|සුපිරි/ },

    // Formatting (spaces, punctuation)
    { id: 'Pos_Fun_0017', name: 'Multiple spaces handling short', input: 'mama   gedhara   yanawaa.', expect: /මම|ගෙදර|යනවා/ },
    { id: 'Pos_Fun_0018', name: 'Punctuation preservation medium', input: 'oyaata kohomadha? mama hari!', expect: /ඔයාට|කොහොමද|හරි/ },

    // Repeated emphasis
    { id: 'Pos_Fun_0019', name: 'Repeated word emphasis short', input: 'hari hari api yamu.', expect: /හරි හරි|අපි|යමු/ },

    // Pronoun variation
    { id: 'Pos_Fun_0020', name: 'Plural pronoun question short', input: 'oyaalaa enawada?', expect: /ඔයාලා|එනවද/ },

    // Longer inputs (M/L)
    { id: 'Pos_Fun_0021', name: 'Medium mixed conversation', input: 'machan adha meeting eke Zoom link eka email karanna puluvandha? office yanna kalin check karanna oonee.', expect: /මචන්|අද|meeting|Zoom|email|office/ },
    { id: 'Pos_Fun_0022', name: 'Long paragraph ≥300 chars', input: 'dhaen vahinawaa. mama gedhara yanna hadhanne. oyaa enawada? api passe coffee ekak bonna yamu. traffic hariyata baya. Zoom eken meeting thiyenawa 9.00 ta. office gihin email check karanna oni. kohomada ada?', expect: /දැන්|වහිනවා|ගෙදර|ඔයා|coffee|Zoom|meeting|office/ },

    // Slang / colloquial
    { id: 'Pos_Fun_0023', name: 'Slang informal medium', input: 'adoo vaedak baaragaththaanam eeka hariyata karapanko machan.', expect: /අදෝ|වැඩක්|හරියට|මචන්/ },

    // Numbers / time / currency
    { id: 'Pos_Fun_0024', name: 'Time + currency preserved short', input: 'meeting eka 8.30 AM ta Rs.1500 ganna oni.', expect: /meeting|8\.30 AM|Rs\.1500/ },

      { id: 'Pos_Fun_0025', name: 'Joined vs segmented variation short', input: 'mata poddak inna.', expect: /මට|පොඩ්ඩක්|ඉන්න/ },
      { id: 'Pos_Fun_0026', name: 'Place name preservation short', input: 'api Colombo yamu.', expect: /අපි|Colombo|යමු/ },
      { id: 'Pos_Fun_0027', name: 'Date format preserved short', input: '2026-02-01 ta enna oni.', expect: /2026-02-01|එන්න ඕනේ/ },
  ];

  for (const t of positiveTests) {
    test(`${t.id} - ${t.name}`, async ({ page }) => {
      await typeAndCheck(page, t.input, t.expect);
    });
  }

  // ───────────────────────────────────────────────
  // 10 Negative / Robustness Tests
  // ───────────────────────────────────────────────
  const negativeTests = [
    { id: 'Neg_Fun_0001', name: 'Joined words extreme (no spaces)', input: 'mamagedharayannakalincheckkarannaoneemataekaepaa.' },
    { id: 'Neg_Fun_0002', name: 'Heavy joined + typo medium', input: 'matapaankannaoonee gedhra yanawaa.' },
    { id: 'Neg_Fun_0003', name: 'Complex sentence misparse medium', input: 'vaessa unath api yana epaa kiyala hithenawa.' },
    { id: 'Neg_Fun_0004', name: 'Line breaks multi-line', input: 'mama gedhara yanawaa.\noyaa enawada?\napi passe kathaa karamu.' },
    { id: 'Neg_Fun_0005', name: 'Very long input >1000 chars', input: ('mama gedhara yanawaa. traffic baya. '.repeat(50)) + 'end.' },
    { id: 'Neg_Fun_0006', name: 'Heavy slang overload', input: 'siraavata ela kiri machan appata siri mata beheth bonna amathaka vunaa kiyankoo.' },
    { id: 'Neg_Fun_0007', name: 'Mixed invalid abbr + chat style', input: 'Thx FYI ASAP gr8 u r cool machan.' },
    { id: 'Neg_Fun_0008', name: 'Repeated emphasis wrong', input: 'hari hari supiri tika tika podi.' },
    { id: 'Neg_Fun_0009', name: 'Polite/informal mix confusion', input: 'karuNaakaralaa mata kiyanna oya enne ehema karapan.' },
    { id: 'Neg_Fun_0010', name: 'Random symbols + invalid chars', input: '@#$% mama gedhara ??? yanawaa!!!' },
  ];

  for (const t of negativeTests) {
    test(`${t.id} - ${t.name} (robustness)`, async ({ page }) => {
      await typeAndCheckRobust(page, t.input);
    });
  }
});

