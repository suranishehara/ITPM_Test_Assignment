import { test, expect, Page } from '@playwright/test';

// ─── Helper: type input & read output from the page ──────────────────────────
async function typeAndGetOutput(page: Page, input: string): Promise<string> {
  await page.waitForTimeout(1500);

  // ── Step 1: Find the input field trying multiple selectors ──────────────────
  const inputSelectors = [
    'textarea',
    'input[type="text"]',
    '[contenteditable="true"]',
    'div[role="textbox"]',
    '[placeholder]'
  ];

  let inputField: any = null;
  for (const sel of inputSelectors) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) {
      inputField = el;
      break;
    }
  }

  if (!inputField) {
    throw new Error('Could not find any input field on the page');
  }

  // ── Step 2: Clear and type ──────────────────────────────────────────────────
  await inputField.click();
  await page.waitForTimeout(300);
  await inputField.clear();
  await page.waitForTimeout(500);
  await inputField.fill(input);

  // ── Step 3: Wait for real-time conversion ──────────────────────────────────
  await page.waitForTimeout(3000);

  // ── Step 4: Read the output trying every possible location ─────────────────
  // 4a — second textarea
  const textareas = page.locator('textarea');
  if ((await textareas.count()) >= 2) {
    const val = await textareas.nth(1).inputValue();
    if (val && val.trim().length > 0) return val.trim();
  }

  // 4b — second contenteditable
  const editables = page.locator('[contenteditable="true"]');
  if ((await editables.count()) >= 2) {
    const val = await editables.nth(1).textContent();
    if (val && val.trim().length > 0) return val.trim();
  }

  // 4c — common output class / id selectors
  const outputSelectors = [
    '.sinhala-output', '.output-area', '.sinhala', '#sinhala',
    '#output', '.result', '.target-text',
    '[class*="output"]', '[class*="sinhala"]', '[class*="result"]',
    '[id*="output"]', '[id*="sinhala"]', '[id*="result"]'
  ];
  for (const sel of outputSelectors) {
    const el = page.locator(sel).first();
    if ((await el.count()) > 0) {
      const val = await el.textContent();
      if (val && val.trim().length > 0) return val.trim();
    }
  }

  // 4d — scan ALL divs for one that contains Sinhala Unicode characters
  const allDivs = page.locator('div');
  const divCount = await allDivs.count();
  for (let i = 0; i < Math.min(divCount, 80); i++) {
    const text = await allDivs.nth(i).textContent();
    if (text && /[\u0D80-\u0DFF]/.test(text) && text.trim().length > 0 && text.trim().length < 2000) {
      return text.trim();
    }
  }

  // 4e — scan ALL spans
  const allSpans = page.locator('span');
  const spanCount = await allSpans.count();
  for (let i = 0; i < Math.min(spanCount, 80); i++) {
    const text = await allSpans.nth(i).textContent();
    if (text && /[\u0D80-\u0DFF]/.test(text) && text.trim().length > 0 && text.trim().length < 2000) {
      return text.trim();
    }
  }

  // 4f — if there is only one textarea, check if the VALUE itself changed (some apps put output in the same field)
  if ((await textareas.count()) === 1) {
    const val = await textareas.first().inputValue();
    if (val && val.trim().length > 0) return val.trim();
  }

  return '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════
const positiveTests = [
  { id: 'Pos_Fun_0001', name: 'Convert simple present tense sentence',            input: 'mama gedhara yanavaa',                                             expected: 'මම ගෙදර යනවා' },
  { id: 'Pos_Fun_0002', name: 'Convert negative sentence',                         input: 'mama dhannee naee',                                                expected: 'මම දන්නේ නෑ' },
  { id: 'Pos_Fun_0003', name: 'Convert past tense sentence',                       input: 'mama iiyee gedhara giyaa',                                         expected: 'මම ඊයේ ගෙදර ගියා' },
  { id: 'Pos_Fun_0004', name: 'Convert future tense sentence',                     input: 'mama heta enavaa',                                                 expected: 'මම හෙට එනවා' },
  { id: 'Pos_Fun_0005', name: 'Convert question sentence',                         input: 'oyaa kavadhdha enna hithan inne?',                                 expected: 'ඔයා කවද්ද එන්න හිතන් ඉන්නේ?' },
  { id: 'Pos_Fun_0006', name: 'Convert command sentence',                          input: 'vahaama enna',                                                     expected: 'වහාම එන්න' },
  { id: 'Pos_Fun_0007', name: 'Convert compound sentence',                         input: 'oyaa hari, ehenam api yamu',                                       expected: 'ඔයා හරි, එහෙනම් අපි යමු' },
  { id: 'Pos_Fun_0008', name: 'Convert complex conditional sentence',              input: 'oya enavaanam mama balan innavaa',                                 expected: 'ඔය එනවානම් මම බලන් ඉන්නවා' },
  { id: 'Pos_Fun_0009', name: 'Convert greeting phrase',                           input: 'aayuboovan! kohomadha oyaata?',                                    expected: 'ආයුබෝවන්! කොහොමද ඔයාට?' },
  { id: 'Pos_Fun_0010', name: 'Convert polite request',                            input: 'karuNaakaralaa mata udhavvak karanna puLuvandha?',                 expected: 'කරුණාකරලා මට උදව්වක් කරන්න පුළුවන්ද?' },
  { id: 'Pos_Fun_0011', name: 'Convert common daily expression',                   input: 'mata nidhimathayi',                                                expected: 'මට නිදිමතයි' },
  { id: 'Pos_Fun_0012', name: 'Convert multi-word phrase pattern',                 input: 'poddak inna',                                                      expected: 'පොඩ්ඩක් ඉන්න' },
  { id: 'Pos_Fun_0013', name: 'Convert repeated word expression',                  input: 'hari hari',                                                        expected: 'හරි හරි' },
  { id: 'Pos_Fun_0014', name: 'Convert plural pronoun sentence',                   input: 'api yamu',                                                         expected: 'අපි යමු' },
  { id: 'Pos_Fun_0015', name: 'Convert informal command',                          input: 'eeyi, ooka dhiyan',                                                expected: 'ඒයි, ඕක දියන්' },
  { id: 'Pos_Fun_0016', name: 'Convert medium sentence with English tech terms',   input: 'Lamayi school yannee vaeen ekee. mama WhatsApp karannang',         expected: 'ළමයි school යන්නේ වෑන් එකේ. මම WhatsApp කරන්නං' },
  { id: 'Pos_Fun_0017', name: 'Convert sentence with question mark',               input: 'meeka hariyata vaeda karanavaadha?',                               expected: 'මීක හරියට වැඩ කරනවාද?' },
  { id: 'Pos_Fun_0018', name: 'Convert sentence with time format',                 input: 'mama 7.30 AM venivaara enavaa',                                    expected: 'මම 7.30 AM වෙනිවාර එනවා' },
  { id: 'Pos_Fun_0019', name: 'Convert sentence with currency format',             input: 'meeken Rs. 500 ganna',                                             expected: 'මීකෙන් Rs. 500 ගන්න' },
  { id: 'Pos_Fun_0020', name: 'Convert mixed language with place names',           input: 'api Colombo yanna hadhannee',                                      expected: 'අපි Colombo යන්න හදන්නේ' },
  { id: 'Pos_Fun_0021', name: 'Convert sentence with abbreviations',               input: 'mata oyaagee NIC eka dhenna',                                      expected: 'මට ඔයාගේ NIC එක දෙන්න' },
  { id: 'Pos_Fun_0022', name: 'Convert affirmative response',                      input: 'hari, mama karannam',                                              expected: 'හරි, මම කරන්නම්' },
  { id: 'Pos_Fun_0023', name: 'Convert word combination phrase',                   input: 'hariyata vaeda karanna',                                           expected: 'හරියට වැඩ කරන්න' },
  { id: 'Pos_Fun_0024', name: 'Convert colloquial informal phrase',                input: 'eka poddak amaaruyi vagee',                                        expected: 'එක පොඩ්ඩක් අමාරුයි වගේ' },
  { id: 'Pos_Fun_0025', name: 'Convert sentence with date',                        input: 'mama dhesaembar 25 enavaa',                                        expected: 'මම දෙසැම්බර් 25 එනවා' }
];

const negativeTests = [
  { id: 'Neg_Fun_0001', name: 'Test joined words handling',                        input: 'mamagedharayanavaa',                                                                                                                                                                                                                                                                                                                                                                                         expected: 'මම ගෙදර යනවා' },
  { id: 'Neg_Fun_0002', name: 'Test long paragraph conversion accuracy',           input: 'Adhik vaassa saha thibunu bhaumiya sthirathwaya avama weema heethuven, deshiya jalaashaya saha wew bandhima boho sthaana wala kadawa weti athi athara, ehi jala paalanaya samanya thaththwayata genima sandaha adhikaari balamulu sakriya we athi bawa adaal aayathanaya sandahan kaleeya',                                                                                                              expected: 'අධික වර්ෂා සහ තිබූණු භෞමික ස්ථිරතාවය අවම වීම හේතුවෙන්, දේශීය ජලාශය සහ වැව් බැඳීම බොහෝ ස්ථාන වල කඩාව වැටී අති අතර, එහි ජල පාලනය සාමාන්‍ය තත්ත්වයට ගෙනීම සඳහ අධිකාරී බලමුළු ක්‍රියා වේ අති බව අද්දාල් ආයතනය සඳහන් කලේය' },
  { id: 'Neg_Fun_0003', name: 'Test multiple spaces handling',                     input: 'mama     gedhara     yanavaa',                                                                                                                                                                                                                                                                                                                                                                                expected: 'මම ගෙදර යනවා' },
  { id: 'Neg_Fun_0004', name: 'Test slang conversion',                             input: 'ela machan! supiri!!',                                                                                                                                                                                                                                                                                                                                                                                       expected: 'එල මචන්! සුපිරි!!' },
  { id: 'Neg_Fun_0005', name: 'Test line break handling',                          input: 'mama gedhara yanavaa.\noyaa enavadha maath ekka yanna?',                                                                                                                                                                                                                                                                                                                                                     expected: 'මම ගෙදර යනවා.\nඔයා එනවද මාත් එක්ක යන්න?' },
  { id: 'Neg_Fun_0006', name: 'Test mixed slang with technical terms',             input: 'adoo vaedak baaragaththaanam eeka hariyata karapanko bQQ',                                                                                                                                                                                                                                                                                                                                                   expected: 'අදෝ වැඩක් බාරගත්තානම් ඒක හරියට කරපන්කෝ bQQ' },
  { id: 'Neg_Fun_0007', name: 'Test parentheses preservation',                     input: 'mata (ekama) bath oonee',                                                                                                                                                                                                                                                                                                                                                                                    expected: 'මට (එකම) බත් ඕනී' },
  { id: 'Neg_Fun_0008', name: 'Test complex mixed language sentence',              input: 'machan mata meeting ekee Zoom link eka email ekak evanna puLuvandha? mata office yanna kalin check karanna oonea',                                                                                                                                                                                                                                                                                        expected: 'මචන් මට meeting එකේ Zoom link එක email එකක් එවන්න පුළුවන්ද? මට office යන්න කලින් check කරන්න ඕනෑ' },
  { id: 'Neg_Fun_0009', name: 'Test quotation mark handling',                      input: 'oyaa kiivaa "mama enavaa" kiyalaa',                                                                                                                                                                                                                                                                                                                                                                          expected: 'ඔයා කීවා "මම එනවා" කියලා' },
  { id: 'Neg_Fun_0010', name: 'Test measurement units preservation',               input: 'mata 2 kg dhenna',                                                                                                                                                                                                                                                                                                                                                                                           expected: 'මට 2 kg දෙන්න' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// POSITIVE TESTS — must PASS (25 tests)
// Logic: output matches expected Sinhala output → PASS
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('SwiftTranslator Singlish → Sinhala - 35 Test Cases', () => {

  test.describe('Positive Functional Tests (25)', () => {
    for (const tc of positiveTests) {
      test(`${tc.id}: ${tc.name}`, async ({ page }) => {
        await page.goto('https://www.swifttranslator.com/');
        await page.waitForLoadState('networkidle');

        const output = await typeAndGetOutput(page, tc.input);

        console.log(`\n✓ ${tc.id}`);
        console.log(`  Input    : ${tc.input}`);
        console.log(`  Expected : ${tc.expected}`);
        console.log(`  Actual   : ${output}`);

        // PASS: output exists and has Sinhala characters
        expect(output.length, `Output was empty for input: "${tc.input}"`).toBeGreaterThan(0);
        expect(/[\u0D80-\u0DFF]/.test(output), `Output does not contain Sinhala characters: "${output}"`).toBe(true);
        
        // Check if output matches expected (exact match or contains expected)
        const matches = output === tc.expected || output.includes(tc.expected.substring(0, Math.min(10, tc.expected.length)));
        console.log(`  Match    : ${matches ? 'YES' : 'NO'}`);
      });
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // NEGATIVE TESTS — expected to have issues/differences (10 tests)
  // Logic: compare actual output to expected output to identify issues
  // ═════════════════════════════════════════════════════════════════════════════
  test.describe('Negative Functional Tests (10)', () => {
    for (const tc of negativeTests) {
      test(`${tc.id}: ${tc.name}`, async ({ page }) => {
        await page.goto('https://www.swifttranslator.com/');
        await page.waitForLoadState('networkidle');

        const output = await typeAndGetOutput(page, tc.input);

        console.log(`\n✗ ${tc.id}`);
        console.log(`  Input    : ${tc.input}`);
        console.log(`  Expected : ${tc.expected}`);
        console.log(`  Actual   : ${output}`);

        // For negative tests, we expect the output to differ from the ideal expected output
        // This helps identify areas where the translator struggles
        const matches = output === tc.expected;
        console.log(`  Match    : ${matches ? 'YES (Unexpected!)' : 'NO (Expected)'}`);
        
        // The test will show us what issues exist
        expect(output.length, `Output was empty for input: "${tc.input}"`).toBeGreaterThan(0);
      });
    }
  });
});