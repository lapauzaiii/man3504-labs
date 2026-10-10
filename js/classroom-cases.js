/* Classroom datasets are independent of graded application cases. No answer keys. */
window.CLASSROOM_CASES = {
  'w4-forecasting': {
    week: 4, title: 'Quantitative Forecasting', company: 'Cowford Coffee',
    intro: 'Plan weekly coffee-bean purchases using a separate classroom dataset. Compare methods on the same evaluation periods before recommending a purchasing forecast.',
    transfer: 'The Netflix Excel activity and the Cowford Canvas application remain separate activities.',
    tables: [{title:'Weekly demand',headers:['Week','Demand (lb)'],rows:[[1,120],[2,128],[3,125],[4,136],[5,132],[6,140],[7,146],[8,142]]}],
    plot: {title:'Observed demand (lb)',values:[120,128,125,136,132,140,146,142]},
    sections: [
      {title:'Forecast comparison',text:'Use a three-period moving average, a weighted moving average with weights 0.5, 0.3, 0.2 from newest to oldest, and exponential smoothing with alpha 0.3 and an initial Week 2 forecast of 120 lb. Compare all methods over Weeks 4–8.',fields:[['ma','Week 9 moving-average forecast (lb)','number'],['wma','Week 9 weighted-average forecast (lb)','number'],['es','Week 9 exponential-smoothing forecast (lb)','number'],['work','Forecast and error calculations, with period labels','textarea']]},
      {title:'Accuracy and sensitivity',text:'MAD = mean absolute error; MSE = mean squared error; MAPE = mean absolute percentage error. Error = actual minus forecast. Repeat smoothing with alpha 0.6; use the same evaluation window.',fields:[['accuracy','MAD, MSE and MAPE for each method','textarea'],['sensitivity','What changed when alpha increased?','textarea']]},
      {title:'Purchasing recommendation',fields:[['method','Preferred method','select',['Moving average','Weighted moving average','Exponential smoothing']],['decision','Defend the choice using accuracy, responsiveness and a model limitation','textarea'],['risk','What would a promotion or stockout change about these data?','textarea']]}
    ]
  },
  'w9-inventory': {
    week:9,title:'Inventory Management',company:'Cowford Logistics',
    intro:'A truck cannot leave when a critical replacement part is unavailable. Balance replenishment cost, demand uncertainty and the consequences of a stopped route.',
    transfer:'Independent application: Brewery, Medical Supply, Bakery and service-capacity contrasts.',
    tables:[{title:'Brake-pad inventory assumptions',headers:['Input','Value','Unit'],rows:[['Annual demand D',12000,'sets/year'],['Order cost S',48,'$/order'],['Holding cost H',3,'$/set/year'],['Daily demand',40,'sets/operating day'],['Daily standard deviation',6,'sets/day'],['Lead time',5,'operating days'],['Cycle-service target',95,'% (z = 1.65)']]},{title:'Parts portfolio',headers:['Part','Annual usage','Unit cost ($)'],rows:[['A',1000,80],['B',9000,4],['C',2000,12]]}],
    sections:[
      {title:'Order quantity and replenishment trigger',text:'Assume independent daily demand and fixed lead time. EOQ = sqrt(2DS/H); orders/year = D/EOQ; safety stock = z × daily standard deviation × sqrt(lead time); ROP = daily demand × lead time + safety stock.',fields:[['eoq','EOQ (sets)','number'],['orders','Orders per year','number'],['ss','Safety stock (sets)','number'],['rop','Reorder point (sets)','number'],['working','Show the calculation and explain whole-unit rounding','textarea']]},
      {title:'Lead-time disruption',text:'The supplier now needs 8 operating days. Keep the demand assumptions and service target unchanged.',fields:[['shock-ss','Revised safety stock (sets)','number'],['shock-rop','Revised reorder point (sets)','number'],['shock-action','Recommend a response; distinguish how much to order from when to order','textarea']]},
      {title:'Management attention',text:'Rank the three parts by annual dollar usage. Three observations do not establish a full ABC classification. Consider safety criticality separately.',fields:[['abc','Annual dollar usage and ranking','textarea'],['criticality','When should a low-dollar part receive exception management?','textarea'],['review','Preferred review approach','select',['Continuous review (Q)','Periodic review (P)']],['review-reason','Defend the review choice and one assumption that could fail','textarea']]}
    ]
  },
  'w10-lean': {
    week:10,title:'Lean Systems and Vendor Relationships',company:'Cowford Coffee',
    intro:'Analyze an eight-order morning sample. Improve flow without losing service accuracy or merely moving the queue to another workstation.',
    transfer:'Independent application: Cowford Bakery lean transformation.',
    tables:[{title:'Morning sample',headers:['Activity','Minutes'],rows:[['Customer-value-adding work',18],['Waiting',20],['Transportation',5],['Rework',5],['Total elapsed lead time',48]]}],
    plot:{title:'Observed time by activity (minutes)',labels:['Value added','Waiting','Transport','Rework'],values:[18,20,5,5]},
    sections:[
      {title:'Baseline flow',text:'Process cycle efficiency (PCE) = value-adding time / total elapsed lead time × 100. These are aggregate sample totals, not a per-order cycle time.',fields:[['pce','Baseline PCE (%)','number'],['waste','Which waste would you investigate first, and what evidence supports the choice?','textarea']]},
      {title:'Countermeasure trial',text:'A staging change removes 10 minutes of avoidable waiting from the sample; value-adding work and other categories remain unchanged.',fields:[['new-time','Revised lead time (minutes)','number'],['new-pce','Revised PCE (%)','number'],['trial','First countermeasure','select',['Rearrange drink staging','Two-bin cup replenishment','Vendor delivery coordination']],['trial-plan','Define the pilot, owner, measurement window and accuracy safeguard','textarea']]},
      {title:'Vendor and people safeguards',fields:[['vendor','What demand signal, replenishment agreement and contingency would the vendor need?','textarea'],['people','How will you involve staff and prevent faster flow from increasing rework?','textarea'],['decision','State the evidence needed to retain or reverse the countermeasure','textarea']]}
    ]
  },
  'w11-quality': {
    week:11,title:'Quality and Performance Management',company:'Cowford Medical Supply',
    intro:'Classify quarterly spending for sterile kit assembly and labeling. Evaluate prevention and inspection using both cost and patient-safety consequences.',
    transfer:'Independent application: Cowford Brewery cost of quality.',
    tables:[{title:'Quarterly quality spending',headers:['Activity','Cost ($)'],rows:[['Training',8000],['Poka-yoke labeling checks',5000],['Inspection',12000],['Discarded kits',18000],['Rework',7000],['Customer returns',21000],['Regulatory complaint handling',9000]]}],
    sections:[
      {title:'Cost classification',fields:[['classification','Classify each activity as prevention, appraisal, internal failure or external failure','textarea'],['prevention','Prevention total ($)','number'],['appraisal','Appraisal total ($)','number'],['internal','Internal failure total ($)','number'],['external','External failure total ($)','number'],['total','Total cost of quality ($)','number'],['failure-share','Failure cost as a share of total (%)','number']]},
      {title:'Intervention decision',fields:[['intervention','Initial intervention','select',['Prevention controls before sealing','Expand end-of-line inspection','Combination pilot']],['justification','Justify the intervention using severity, evidence and expected cost; identify missing data','textarea']]},
      {title:'DMAIC plan',fields:[['define','Define: problem, customer and scope','textarea'],['measure','Measure: label-error definition and denominator','textarea'],['analyze','Analyze: likely cause and evidence needed','textarea'],['improve','Improve: test, owner and safeguard','textarea'],['control','Control: monitoring rule and response plan','textarea']]}
    ]
  },
  'w12-spc': {
    week:12,title:'Statistical Process Control',company:'Cowford Bakery',
    intro:'Study five consecutive rational subgroups of four artisan loaves. Separate variation in the process mean from variation within a subgroup.',
    transfer:'Independent application: Cowford Coffee SPC at Scale. This is a separate illustrative dataset.',
    tables:[{title:'Loaf weights (grams)',headers:['Subgroup','Loaf 1','Loaf 2','Loaf 3','Loaf 4'],rows:[[1,798,800,801,799],[2,801,800,802,799],[3,800,799,801,800],[4,806,805,807,806],[5,800,799,801,800]]},{title:'Chart constants and target',headers:['Parameter','Value'],rows:[['Subgroup size n',4],['A2',0.729],['D3',0],['D4',2.282],['Illustrative target weight (g)',800]]}],
    plot:{title:'Individual loaf weights (g), in subgroup order',values:[798,800,801,799,801,800,802,799,800,799,801,800,806,805,807,806,800,799,801,800]},
    sections:[
      {title:'Subgroup statistics',text:'Calculate each subgroup mean and range, then the grand mean and average range. Retain precision until the final result.',fields:[['means','Five subgroup means (g), in order','text'],['ranges','Five subgroup ranges (g), in order','text'],['grand','Grand mean (g)','number'],['rbar','Average range (g)','number']]},
      {title:'Trial control limits',text:'X-bar limits = grand mean ± A2 × average range. R limits = D3 × average range and D4 × average range. These five subgroups yield illustrative trial limits, not a validated long-term baseline. The target is not a specification limit.',fields:[['x-lcl','X-bar lower control limit (g)','number'],['x-ucl','X-bar upper control limit (g)','number'],['r-lcl','R lower control limit (g)','number'],['r-ucl','R upper control limit (g)','number'],['signals','Which chart signals require investigation, and why?','textarea']]},
      {title:'Investigation and re-baselining',fields:[['investigation','What would you investigate before adjusting the process?','textarea'],['baseline','How would a confirmed special cause affect the trial baseline?','textarea'],['limits','Explain why control limits and specification limits answer different questions','textarea']]}
    ]
  },
  'w13-sourcing': {
    week:13,title:'Ethics, Sustainability and Global Operations',company:'Cowford Brewery',
    intro:'Select a malt supplier using total cost of ownership and explicit due diligence. Separate measured costs from ethical requirements and unmeasured environmental impacts.',
    transfer:'Independent application: Cowford Coffee sourcing decision.',
    tables:[{title:'Annual malt requirements: 20,000 lb',headers:['Supplier','Price ($/lb)','Freight ($/year)','Expected quality losses ($/year)','Labor documentation'],rows:[['A',1.80,9000,2000,'Verify before contract'],['B',1.55,14000,7000,'No independent verification available']]}],
    sections:[
      {title:'Total cost of ownership',text:'Modeled annual TCO = annual pounds × unit price + annual freight + expected annual quality losses. Do not add a fabricated monetary value for missing labor or environmental evidence.',fields:[['a-tco','Supplier A annual TCO ($)','number'],['b-tco','Supplier B annual TCO ($)','number'],['difference','Difference and arithmetic','textarea']]},
      {title:'People, Planet, Profit',fields:[['people','People: required labor evidence and due-diligence gate','textarea'],['planet','Planet: environmental evidence needed; distinguish unknown from acceptable','textarea'],['profit','Profit: modeled costs and excluded risks','textarea']]},
      {title:'Conditional sourcing decision',fields:[['supplier','Current decision','select',['Proceed conditionally with A','Proceed conditionally with B','Delay pending due diligence']],['conditions','State verification requirements before a contract can be signed','textarea'],['contingency','Specify supply continuity safeguards and what would change your recommendation','textarea']]}
    ]
  },
  'w14-performance': {
    week:14,title:'Performance Measurement and Continuous Improvement',company:'Cowford Tech Services',
    intro:'Operating margin has improved while service and renewal measures have weakened. Form a causal hypothesis and design a test rather than claiming that descriptive changes prove causation.',
    transfer:'Independent application: Cowford Fitness Performance Paradox.',
    tables:[{title:'Quarterly performance',headers:['Measure','Earlier quarter','Current quarter','Unit'],rows:[['Renewal rate',92,86,'%'],['Training per person',12,5,'hours'],['First-contact resolution',78,68,'%'],['Average first response',3,7,'hours'],['Operating margin',18,20,'%']]}],
    sections:[
      {title:'Measure the change',text:'For rates, distinguish percentage-point differences from relative percentage changes. Record earlier-to-current changes with direction and units.',fields:[['renewal','Renewal change (percentage points)','number'],['training','Training change (hours/person)','number'],['resolution','First-contact resolution change (percentage points)','number'],['response','First-response change (hours)','number'],['margin','Margin change (percentage points)','number'],['relative','Relative percentage change in renewal rate; show the denominator','textarea']]},
      {title:'Balanced Scorecard hypothesis',fields:[['learning','Learning and Growth: capability measure and action','textarea'],['process','Internal Process: mechanism and leading measure','textarea'],['customer','Customer: outcome and lagging measure','textarea'],['financial','Financial: sustainable outcome and potential tradeoff','textarea'],['causal','Connect the four perspectives; state what the data do and do not establish','textarea']]},
      {title:'Four-week PDCA pilot',fields:[['plan','Plan: training/triage pilot, owner, baseline, target and guardrail','textarea'],['do','Do: intervention and collection schedule','textarea'],['check','Check: comparison method and SPC monitoring; use a suitable historical baseline','textarea'],['act','Act: retain, revise or reverse criteria','textarea']]}
    ]
  }
};
