from typing import List, Dict, Any

class RecommendationService:
    @staticmethod
    def generate_recommendations(metrics: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Generate actionable recommendations based on active risk factors.
        """
        recs = []

        if metrics.get("ownership_disputes_count", 0) > 0:
            recs.append({
                "title": "Schedule Joint Ownership Hearing",
                "department": "Revenue & Land Reforms Department",
                "priority": "High",
                "description": "Issue notice under Section 15 to all legal heirs for dispute reconciliation and title demarcation."
            })

        if metrics.get("survey_completed_pct", 100.0) < 60.0:
            recs.append({
                "title": "Deploy Cadastral Survey Unit",
                "department": "Survey & Cadastral Directorate",
                "priority": "High",
                "description": "Fast-track physical boundary demarcations with DGPS rovers to resolve boundary bottlenecks."
            })

        if metrics.get("missing_doc_pct", 0.0) > 20.0:
            recs.append({
                "title": "Dispatch Document Checklist Notice",
                "department": "Revenue & Land Reforms Department",
                "priority": "Medium",
                "description": "Send SMS reminders and field notices to affected landowners for missing RoR and bank passbooks."
            })

        if metrics.get("compensation_progress_pct", 100.0) < 50.0:
            recs.append({
                "title": "Expedite Compensation Sanctions",
                "department": "Compensation & Accounts Cell",
                "priority": "High",
                "description": "Forward draft award statements to Competent Authority for prompt financial sanction."
            })

        if metrics.get("bank_verification_pct", 100.0) < 60.0:
            recs.append({
                "title": "Coordinate Bank PFMS Verification",
                "department": "Compensation & Accounts Cell",
                "priority": "Medium",
                "description": "Liaise with lead district banks for bulk IFSC and Aadhaar-seeded bank account validations."
            })

        if metrics.get("overdue_tasks_count", 0) > 0:
            recs.append({
                "title": "Escalate Overdue Departmental Tasks",
                "department": "Project Authority Cell",
                "priority": "High",
                "description": f"Escalate {metrics.get('overdue_tasks_count')} overdue departmental tasks to Project Director."
            })

        if metrics.get("open_grievances_count", 0) > 0:
            recs.append({
                "title": "Fast-Track Landowner Grievance Redressal",
                "department": "Legal & Dispute Resolution Cell",
                "priority": "Medium",
                "description": "Convene Tahsil grievance redressal camp to address pending landowner claims."
            })

        if not recs:
            recs.append({
                "title": "Maintain Routine Monitoring",
                "department": "Revenue & Land Reforms Department",
                "priority": "Low",
                "description": "Case is progressing within planned milestones. Continue weekly status review."
            })

        return recs
