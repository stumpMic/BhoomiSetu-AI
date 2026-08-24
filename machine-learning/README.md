# BhoomiSetu AI — Machine Learning Subsystem

Delay risk classifier, delay duration regressor, feature engineering pipeline, and SHAP explainability engine.

## Models
1. **Delay Risk Classifier**: Random Forest Classifier predicting whether a land acquisition case will encounter severe delay ($P \in [0, 1]$) categorized into **Low (0–39%)**, **Medium (40–69%)**, and **High (70–100%)** risk.
2. **Delay Days Regressor**: Random Forest Regressor estimating the exact number of delayed days ($\hat{y} \in \mathbb{N}$).
3. **Explainability Engine**: Feature importance and SHAP-based directional contribution breakdown.
4. **Deterministic Fallback**: Rule-based heuristic scoring engine when ML model files are omitted.

## Workflow

```bash
# 1. Generate synthetic training dataset (2,000+ realistic cases)
python src/generate_data.py

# 2. Train classifier
python src/train_classifier.py

# 3. Train regressor
python src/train_regressor.py

# 4. Evaluate both models and generate evaluation metrics
python src/evaluate.py
```
