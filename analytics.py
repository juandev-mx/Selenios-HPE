# analytics.py
from flask import Blueprint, jsonify
from models import db, ClientCompany, User, Equipment, POC, POCEquipment
from sqlalchemy import func, case

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/kpi')
def get_kpi_data():
    try:
        # Ingresos Totales (suma de precios de equipos en POCs aprobados)
        total_revenue = (
        db.session.query(func.coalesce(func.sum(Equipment.price), 0))
        .join(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)
        .join(POC, POC.poc_id == POCEquipment.poc_id)
        .filter(POC.is_approved == True)
        .scalar()
        )

        # Tasa de Aprobación
        total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
        approved_pocs = db.session.query(func.count(POC.poc_id))\
            .filter(POC.is_approved == True).scalar()
        
        approval_rate = (approved_pocs / total_pocs * 100) if total_pocs > 0 else 0

        # Clientes Activos (compañías con POCs)
        active_clients = db.session.query(func.count(func.distinct(ClientCompany.client_company_id)))\
            .join(User, User.client_company_id == ClientCompany.client_company_id)\
            .join(POC, POC.client_user_id == User.user_id)\
            .scalar()

        return jsonify({
            'total_revenue': float(total_revenue),
            'approval_rate': round(approval_rate, 2),
            'active_clients': active_clients
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/api/analytics/solutions-performance')
def get_solutions_performance():
    try:
        # Top soluciones por ingresos
        top_solutions = (
            db.session.query(
            Equipment.product_description,
            func.sum(Equipment.price).label('total_revenue'),
            func.count(POCEquipment.poc_id).label('poc_count')
        )
        .join(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)
        .join(POC, POC.poc_id == POCEquipment.poc_id)
        .filter(POC.is_approved == True)
        .group_by(Equipment.product_description)
        .order_by(func.sum(Equipment.price).desc())
        .limit(5).all()
        )

        solutions_data = []
        for solution in top_solutions:
            solutions_data.append({
                'name': solution.product_description,
                'revenue': float(solution.total_revenue),
                'poc_count': solution.poc_count
            })

        return jsonify(solutions_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/api/analytics/clients-performance')
def get_clients_performance():
    try:
        # Clientes clave por ingresos
        top_clients = (
        db.session.query(
            ClientCompany.company_name,
            func.sum(Equipment.price).label('total_revenue'),
            func.count(POC.poc_id).label('poc_count')
        )
        .join(User, User.client_company_id == ClientCompany.client_company_id)
        .join(POC, POC.client_user_id == User.user_id)
        .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)
        .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)
        .filter(POC.is_approved == True)
        .group_by(ClientCompany.company_name)
        .order_by(func.sum(Equipment.price).desc())
        .limit(10).all()
        )

        clients_data = []
        for client in top_clients:
            clients_data.append({
                'name': client.company_name,
                'revenue': float(client.total_revenue),
                'poc_count': client.poc_count,
                'status': 'Active' if client.poc_count > 0 else 'Inactive'
            })

        return jsonify(clients_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/api/analytics/team-performance')
def get_team_performance():
    try:
        # Rendimiento del equipo (HPE Reps)
        team_performance = (
            db.session.query(
            User.name,
            User.user_id,
            func.sum(Equipment.price).label('total_revenue'),
            func.count(POCEquipment.poc_equipment_id).label('equipment_used')
        )
        .join(POC, POC.client_user_id == User.user_id)
        .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)
        .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)
        .filter(POC.is_approved == True, User.role == 'HPE_REP')
        .group_by(User.user_id, User.name)
        .order_by(func.sum(Equipment.price).desc()).all()
        )

        # Obtener información de managers
        team_data = []
        for member in team_performance:
            # Buscar el manager (usuario al que reporta)
            manager = db.session.query(User.name).filter(
                User.user_id == member.user_id
            ).first() if member.user_id else None

            team_data.append({
                'rep_name': member.name,
                'manager_name': manager.name if manager else 'Sin manager',
                'revenue': float(member.total_revenue),
                'equipment_used': member.equipment_used
            })

        return jsonify(team_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/api/analytics/approval-trends')
def get_approval_trends():
    try:
        # Tendencia de aprobaciones por mes
        monthly_trends = db.session.query(
            func.date_trunc('month', POC.created_date).label('month'),
            func.count(POC.poc_id).label('total_pocs'),
            func.sum(case((POC.is_approved == True, 1), else_=0)).label('approved_pocs')
        ).filter(POC.created_date.isnot(None))\
         .group_by(func.date_trunc('month', POC.created_date))\
         .order_by(func.date_trunc('month', POC.created_date))\
         .limit(12).all()

        trends_data = []
        for trend in monthly_trends:
            approval_rate = (trend.approved_pocs / trend.total_pocs * 100) if trend.total_pocs > 0 else 0
            trends_data.append({
                'month': trend.month.strftime('%Y-%m'),
                'approval_rate': round(approval_rate, 2),
                'total_pocs': trend.total_pocs
            })

        return jsonify(trends_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500