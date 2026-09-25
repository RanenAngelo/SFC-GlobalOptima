/**
 * DEVELOPMENT / DEMO DATA — dual-pipeline comparison (Steps 12–14, 47).
 * Spark MLlib vs Python DS: independently generated results, compared side-by-side.
 */

import { DualPipelineRow, DualPipelineSummary, ModelCandidate } from '../../api/types';
import { round, rng } from './_util';
import { ITEMS } from './catalog';

const CLASSES = ['Profit Driver', 'Volume Driver', 'Hidden Opportunity', 'Low Performer'];

export function buildDualPipeline(): DualPipelineSummary {
  const r = rng(1414);
  const rows: DualPipelineRow[] = [];

  // 120 unseen records (deliverable: at least 100)
  for (let i = 0; i < 120; i++) {
    const item = ITEMS[i % ITEMS.length];
    const actual = CLASSES[Math.floor(r() * CLASSES.length)];
    const spark = actual;
    const python = r() > 0.092 ? actual : CLASSES[(CLASSES.indexOf(actual) + 1 + Math.floor(r() * 2)) % CLASSES.length];
    const match = spark === python;
    const numericDiff = match ? 0 : round(Math.abs(r() * 0.18 + 0.03), 3);
    rows.push({
      recordId: `${item.id}`,
      actual,
      sparkResult: spark,
      pythonResult: python,
      match,
      numericDiff,
      sparkConfidence: round(0.72 + r() * 0.26, 3),
      pythonConfidence: round(0.7 + r() * 0.27, 3),
      explanation: match
        ? undefined
        : r() > 0.5
          ? 'Feature scaling differs: Spark pipeline uses standardization inside the MLlib pipeline; Python uses raw skewed margin features.'
          : 'Borderline probability mass near decision boundary — both models agree within 0.06 confidence.',
    });
  }

  const matches = rows.filter((x) => x.match).length;
  const agreementPct = round((matches / rows.length) * 100, 1);

  const candidates: ModelCandidate[] = [
    { pipeline: 'spark', algorithm: 'Random Forest', version: 'spark-mllib-rf@1.4.0', accuracy: 0.893, f1: 0.881, selected: true },
    { pipeline: 'spark', algorithm: 'Decision Tree', version: 'spark-mllib-dt@1.4.0', accuracy: 0.856, f1: 0.842, selected: false },
    { pipeline: 'spark', algorithm: 'Logistic Regression', version: 'spark-mllib-lr@1.4.0', accuracy: 0.847, f1: 0.834, selected: false },
    { pipeline: 'python', algorithm: 'XGBoost', version: 'xgb-menuclf@2.1.0', accuracy: 0.906, f1: 0.897, selected: true },
    { pipeline: 'python', algorithm: 'Gradient Boosting (sklearn)', version: 'skl-gbm@2.1.0', accuracy: 0.884, f1: 0.872, selected: false },
    { pipeline: 'python', algorithm: 'Logistic Regression', version: 'skl-lr@2.1.0', accuracy: 0.851, f1: 0.838, selected: false },
  ];

  return {
    agreementPct,
    disagreementCount: rows.length - matches,
    comparedRecords: rows.length,
    candidates,
    rows,
    narrative: {
      happened: `${agreementPct}% agreement across ${rows.length} unseen records between independently trained Spark and Python models.`,
      why: 'Disagreements cluster on borderline instances and feature-scaling choices — not on duplicated predictions (pipelines are independent).',
      next: 'Review the disagreement explanations before locking either model version for production scoring.',
      severity: 'medium',
    },
  };
}
