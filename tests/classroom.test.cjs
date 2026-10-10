const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/classroom-cases.js'), 'utf8');
const context = {window:{}};
vm.runInNewContext(source,context);
const cases = context.window.CLASSROOM_CASES;

test('every classroom case has a matching entry, unique response ids and valid table rows',()=>{
  assert.equal(Object.keys(cases).length,7);
  for(const [slug,lesson] of Object.entries(cases)){
    const html=fs.readFileSync(path.join(root,'labs',slug,'index.html'),'utf8');
    assert.ok(html.includes(`data-case="${slug}"`));
    const fields=lesson.sections.flatMap(s=>s.fields);
    assert.equal(new Set(fields.map(f=>f[0])).size,fields.length);
    for(const [,label,type,options] of fields){
      assert.ok(label);
      assert.ok(['text','number','textarea','select'].includes(type));
      if(type==='select')assert.ok(options.length>=2);
    }
    for(const table of lesson.tables)for(const row of table.rows)assert.equal(row.length,table.headers.length);
    assert.ok(!/verified instructor solution|answer key|\[answer:|checkpoints and feedback/i.test(JSON.stringify(lesson)));
    assert.ok(!/notion\.(so|com)/i.test(JSON.stringify(lesson)));
  }
});

test('new datasets remain distinct from the graded cases and preserve source assumptions',()=>{
  assert.equal(cases['w9-inventory'].company,'Cowford Logistics');
  assert.equal(cases['w9-inventory'].tables[0].rows[0][1],12000);
  assert.equal(cases['w12-spc'].tables[0].rows.length,5);
  assert.equal(cases['w12-spc'].tables[0].rows[3][1],806);
  assert.equal(cases['w13-sourcing'].company,'Cowford Brewery');
  assert.equal(cases['w14-performance'].company,'Cowford Tech Services');
});

test('all local homepage links exist and Weeks 9–14 are published entries',()=>{
  const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const match of home.matchAll(/href="(labs\/[^"?]+)(?:\?[^\"]*)?"/g)){
    assert.ok(fs.existsSync(path.join(root,match[1],'index.html')),match[1]);
  }
  for(const slug of Object.keys(cases))assert.ok(home.includes(`labs/${slug}/`));
  assert.ok(home.includes('eight operating subsidiaries'));
});

test('midterm practice uses corrected week mapping and MRP answer',()=>{
  const html=fs.readFileSync(path.join(root,'labs/midterm-prep/index.html'),'utf8');
  assert.ok(!html.includes('W4: Capacity'));
  assert.ok(!html.includes('W3: Lean & TOC'));
  assert.ok(html.includes('W4: Quantitative Forecasting'));
  assert.ok(html.includes('W5: Qualitative & Regression'));
  const row=html.split('\n').find(line=>line.includes('directly produces planned order releases?'));
  assert.ok(row.includes('ans:0'));
});
