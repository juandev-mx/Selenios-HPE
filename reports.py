# reports.py
from flask import Blueprint, jsonify, make_response
from models import db, ClientCompany, User, Equipment, POC, POCEquipment, EquipmentItem
from sqlalchemy import func, case, text, desc
from datetime import datetime
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime, timedelta
from sqlalchemy import and_, or_

reports_bp = Blueprint('reports', __name__)

# Styles for PDF
def get_styles():
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#00263B'),
        spaceAfter=30,
        alignment=1  # Centered
    )
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#618975'),
        alignment=1
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor('#11D473'),
        spaceAfter=12
    )
    return title_style, subtitle_style, heading_style

def create_pdf_report(report_data, report_title):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
    elements = []
    
    title_style, subtitle_style, heading_style = get_styles()
    
    # Report title
    elements.append(Paragraph(f"Report: {report_title}", title_style))
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", subtitle_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Report content
    for section_title, data in report_data.items():
        elements.append(Paragraph(section_title, heading_style))
        
        if isinstance(data, list) and all(isinstance(row, (list, tuple)) for row in data):
            # It's a table
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#11D473')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F6F8F7')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E0E8E4'))
            ]))
            elements.append(table)
        else:
            # It's simple text
            elements.append(Paragraph(str(data), getSampleStyleSheet()['Normal']))
        
        elements.append(Spacer(1, 0.2*inch))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

@reports_bp.route('/api/reports/<report_type>')
def generate_report(report_type):
    try:
        report_functions = {
            'total_empresas': report_total_empresas,
            'pocs_por_empresa': report_pocs_por_empresa,
            'tasa_aprobacion_empresa': report_tasa_aprobacion_empresa,
            'clientes_pocs_completados': report_clientes_pocs_completados,
            'tiempo_promedio_pocs': report_tiempo_promedio_pocs,
            'total_pocs': report_total_pocs,
            'pocs_aprobados_vs_no': report_pocs_aprobados_vs_no,
            'pocs_curso_vs_completados': report_pocs_curso_vs_completados,
            'tiempo_promedio_completado': report_tiempo_promedio_completado,
            'pocs_por_representante': report_pocs_por_representante,
            'proyectos_justificacion': report_proyectos_justificacion,
            'total_equipos_por_solucion': report_total_equipos_por_solucion,
            'costo_total_equipos_poc': report_costo_total_equipos_poc,
            'equipos_mas_utilizados': report_equipos_mas_utilizados,
            'soluciones_mayor_inversion': report_soluciones_mayor_inversion,
            'equipamiento_promedio_poc': report_equipamiento_promedio_poc,
            'comparacion_soluciones_equipos': report_comparacion_soluciones_equipos,
            'usuarios_mas_pocs': report_usuarios_mas_pocs,
            'relacion_usuarios_clientes': report_relacion_usuarios_clientes,
            'usuarios_internos_externos': report_usuarios_internos_externos,
            'usuarios_activos': report_usuarios_activos,
            'costo_total_poc': report_costo_total_poc,
            'soluciones_mas_caras': report_soluciones_mas_caras,
            'pocs_mayor_inversion': report_pocs_mayor_inversion,
            'empresa_mayor_inversion': report_empresa_mayor_inversion
        }
        
        if report_type not in report_functions:
            return jsonify({'error': 'Invalid report type'}), 400
        
        report_data, report_title = report_functions[report_type]()
        pdf_buffer = create_pdf_report(report_data, report_title)
        
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=report_{report_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def report_total_empresas():
    try:
        total_empresas = db.session.query(func.count(ClientCompany.client_company_id)).scalar()
        
        # Get formatted company details
        detalle_empresas = db.session.query(
            ClientCompany.client_company_id,
            ClientCompany.company_name,
            ClientCompany.manager_client_name,
            func.count(User.user_id).label('total_usuarios')
        ).outerjoin(User, User.client_company_id == ClientCompany.client_company_id)\
         .group_by(ClientCompany.client_company_id, ClientCompany.company_name, ClientCompany.manager_client_name).all()

        # Convert results to list of lists
        detalle_lista = []
        for empresa in detalle_empresas:
            detalle_lista.append([
                empresa.client_company_id,
                empresa.company_name,
                empresa.manager_client_name or 'Not assigned',
                empresa.total_usuarios
            ])

        report_data = {
            'General Summary': f"Total companies registered in the system: {total_empresas}",
            'Company Details': [
                ['Company ID', 'Company Name', 'Manager', 'Total Users'],
                *detalle_lista
            ]
        }
        
        return report_data, "Total Registered Companies"
    except Exception as e:
        return {'error': str(e)}, "Error in Total Companies"

def report_pocs_por_empresa():
    pocs_por_empresa = db.session.query(
        ClientCompany.company_name,
        func.count(POC.poc_id).label('total_pocs'),
        func.sum(case((POC.is_approved == True, 1), else_=0)).label('pocs_aprobados'),
        func.sum(case((POC.is_approved == False, 1), else_=0)).label('pocs_rechazados')
    ).join(User, User.client_company_id == ClientCompany.client_company_id)\
     .join(POC, POC.client_user_id == User.user_id)\
     .group_by(ClientCompany.company_name)\
     .order_by(desc('total_pocs')).all()
    
    report_data = {
        'PoCs by Company': [
            ['Company', 'Total PoCs', 'Approved', 'Rejected', 'Pending'],
            *[[empresa, total, aprobados, rechazados, total - aprobados - rechazados] 
              for empresa, total, aprobados, rechazados in pocs_por_empresa]
        ]
    }
    
    return report_data, "PoCs by Company"

def report_tasa_aprobacion_empresa():
    tasa_aprobacion = db.session.query(
        ClientCompany.company_name,
        func.count(POC.poc_id).label('total_pocs'),
        func.sum(case((POC.is_approved == True, 1), else_=0)).label('pocs_aprobados'),
        (func.sum(case((POC.is_approved == True, 1), else_=0)) * 100.0 / func.count(POC.poc_id)).label('tasa_aprobacion')
    ).join(User, User.client_company_id == ClientCompany.client_company_id)\
     .join(POC, POC.client_user_id == User.user_id)\
     .group_by(ClientCompany.company_name)\
     .having(func.count(POC.poc_id) > 0)\
     .order_by(desc('tasa_aprobacion')).all()
    
    report_data = {
        'Approval Rate by Company': [
            ['Company', 'Total PoCs', 'Approved PoCs', 'Approval Rate (%)'],
            *[[empresa, total, aprobados, f"{tasa:.2f}%"] 
              for empresa, total, aprobados, tasa in tasa_aprobacion]
        ]
    }
    
    return report_data, "Approval Rate by Company"

def report_clientes_pocs_completados():
    clientes_pocs = db.session.query(
        ClientCompany.company_name,
        func.count(POC.poc_id).label('total_pocs'),
        func.sum(case((POC.completion_date.isnot(None), 1), else_=0)).label('pocs_completados'),
        func.sum(case((POC.completion_date.is_(None), 1), else_=0)).label('pocs_en_curso')
    ).join(User, User.client_company_id == ClientCompany.client_company_id)\
     .join(POC, POC.client_user_id == User.user_id)\
     .group_by(ClientCompany.company_name)\
     .order_by(desc('pocs_completados')).all()
    
    report_data = {
        'Clients with Most Completed PoCs': [
            ['Company', 'Total PoCs', 'Completed', 'In Progress', '% Completed'],
            *[[empresa, total, completados, en_curso, f"{(completados/total*100):.1f}%" if total > 0 else "0%"]
              for empresa, total, completados, en_curso in clientes_pocs]
        ]
    }
    
    return report_data, "Clients with Most Completed PoCs"

def report_tiempo_promedio_pocs():
    try:
        # Calculate average execution time (completion_date - created_date) per client
        tiempo_promedio = db.session.query(
            ClientCompany.company_name,
            func.avg(
                func.extract('epoch', POC.completion_date) - 
                func.extract('epoch', POC.created_date)
            ).label('tiempo_promedio_segundos')
        ).join(User, User.client_company_id == ClientCompany.client_company_id)\
         .join(POC, POC.client_user_id == User.user_id)\
         .filter(POC.completion_date.isnot(None))\
         .group_by(ClientCompany.company_name).all()

        report_data = {
            'Average Execution Time by Client': [
                ['Company', 'Average Time (days)'],
                *[[empresa, f"{(tiempo/86400):.1f} days" if tiempo else "No data"] 
                  for empresa, tiempo in tiempo_promedio]
            ]
        }
        
        return report_data, "Average Execution Time by Client"
    except Exception as e:
        return {'error': str(e)}, "Error in Average Execution Time"

def report_total_pocs():
    total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
    pocs_aprobados = db.session.query(func.count(POC.poc_id)).filter(POC.is_approved == True).scalar()
    pocs_completados = db.session.query(func.count(POC.poc_id)).filter(POC.completion_date.isnot(None)).scalar()
    
    report_data = {
        'General Summary': f"Total PoCs in the system: {total_pocs}",
        'Detailed Statistics': [
            ['Metric', 'Value'],
            ['Total PoCs', total_pocs],
            ['Approved PoCs', pocs_aprobados],
            ['Completed PoCs', pocs_completados],
            ['Approval Rate', f"{(pocs_aprobados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
            ['Completion Rate', f"{(pocs_completados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"]
        ]
    }
    
    return report_data, "Total Registered PoCs"

def report_pocs_aprobados_vs_no():
    try:
        total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
        aprobados = db.session.query(func.count(POC.poc_id)).filter(POC.is_approved == True).scalar()
        rechazados = db.session.query(func.count(POC.poc_id)).filter(POC.is_approved == False).scalar()
        pendientes = total_pocs - aprobados - rechazados

        report_data = {
            'PoC Distribution by Approval Status': [
                ['Status', 'Quantity', 'Percentage'],
                ['Approved', aprobados, f"{(aprobados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Rejected', rechazados, f"{(rechazados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Pending', pendientes, f"{(pendientes/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Total', total_pocs, '100%']
            ]
        }
        
        return report_data, "Approved vs Non-Approved PoCs"
    except Exception as e:
        return {'error': str(e)}, "Error in Approved vs Non-Approved PoCs"

def report_pocs_curso_vs_completados():
    try:
        total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
        completados = db.session.query(func.count(POC.poc_id)).filter(POC.completion_date.isnot(None)).scalar()
        en_curso = total_pocs - completados

        report_data = {
            'PoCs In Progress vs Completed': [
                ['Status', 'Quantity', 'Percentage'],
                ['Completed', completados, f"{(completados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['In Progress', en_curso, f"{(en_curso/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Total', total_pocs, '100%']
            ]
        }
        
        return report_data, "PoCs In Progress vs Completed"
    except Exception as e:
        return {'error': str(e)}, "Error in PoCs In Progress vs Completed"

def report_tiempo_promedio_completado():
    try:
        # First check if there are completed PoCs
        pocs_completados = db.session.query(func.count(POC.poc_id)).filter(
            POC.completion_date.isnot(None)
        ).scalar()
        
        if pocs_completados == 0:
            report_data = {
                'Information': 'No completed PoCs to calculate times',
                'Details': 'All PoCs are pending completion or have no completion date.'
            }
            return report_data, "Average Completion Time"

        # Calculate average time using direct date difference
        tiempo_promedio = db.session.query(
            func.avg(POC.completion_date - POC.created_date)
        ).filter(POC.completion_date.isnot(None)).scalar()

        # PoCs with longest completion time
        tiempos_extremos = db.session.query(
            POC.poc_id,
            ClientCompany.company_name,
            User.name,
            (POC.completion_date - POC.created_date).label('tiempo_duracion'),
            POC.created_date,
            POC.completion_date
        ).join(User, User.user_id == POC.client_user_id)\
         .join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
         .filter(POC.completion_date.isnot(None))\
         .order_by(desc('tiempo_duracion')).limit(10).all()

        # Format data for table
        tabla_tiempos = []
        for poc in tiempos_extremos:
            dias = poc.tiempo_duracion.days if poc.tiempo_duracion else 0
            tabla_tiempos.append([
                poc.poc_id,
                poc.company_name,
                poc.name,
                f"{dias} days",
                poc.created_date.strftime('%Y-%m-%d') if poc.created_date else 'N/A',
                poc.completion_date.strftime('%Y-%m-%d') if poc.completion_date else 'N/A'
            ])

        # Calculate average time in days
        tiempo_promedio_dias = tiempo_promedio.days if tiempo_promedio else 0

        report_data = {
            'Summary': f"Average completion time: {tiempo_promedio_dias} days (based on {pocs_completados} completed PoCs)",
            'PoCs with Longest Completion Time': [
                ['PoC ID', 'Company', 'User', 'Duration', 'Start Date', 'Completion Date'],
                *tabla_tiempos
            ]
        }
        
        return report_data, "Average Completion Time"
    except Exception as e:
        return {'Error': f"Error calculating times: {str(e)}"}, "Average Completion Time"

def report_pocs_por_representante():
    try:
        # First check if there are HPE representatives
        total_reps = db.session.query(func.count(User.user_id)).filter(
            User.role == 'HPE_REP'
        ).scalar()
        
        if total_reps == 0:
            report_data = {
                'Information': 'No HPE representatives registered in the system'
            }
            return report_data, "PoCs by HPE Representative"

        # Query for PoCs by HPE representative
        pocs_por_rep = db.session.query(
            User.user_id,
            User.name,
            User.mail,
            func.count(POC.poc_id).label('total_pocs'),
            func.sum(case((POC.is_approved == True, 1), else_=0)).label('pocs_aprobados'),
            func.sum(case((POC.is_approved == False, 1), else_=0)).label('pocs_rechazados'),
            func.sum(case((POC.is_approved.is_(None), 1), else_=0)).label('pocs_pendientes'),
            func.sum(case((POC.completion_date.isnot(None), 1), else_=0)).label('pocs_completados')
        ).outerjoin(POC, POC.client_user_id == User.user_id)\
         .filter(User.role == 'HPE_REP')\
         .group_by(User.user_id, User.name, User.mail)\
         .order_by(desc('total_pocs')).all()

        # Format data
        tabla_reps = []
        for rep in pocs_por_rep:
            total = rep.total_pocs or 0
            aprobados = rep.pocs_aprobados or 0
            tasa_aprobacion = f"{(aprobados/total*100):.1f}%" if total > 0 else "0%"
            
            tabla_reps.append([
                rep.name,
                rep.mail,
                total,
                aprobados,
                rep.pocs_rechazados or 0,
                rep.pocs_pendientes or 0,
                rep.pocs_completados or 0,
                tasa_aprobacion
            ])

        report_data = {
            'Summary': f"Total HPE representatives: {total_reps}",
            'PoCs by HPE Representative': [
                ['Representative', 'Email', 'Total PoCs', 'Approved', 'Rejected', 'Pending', 'Completed', 'Approval Rate'],
                *tabla_reps
            ]
        }
        
        return report_data, "PoCs by HPE Representative"
    except Exception as e:
        return {'Error': f"Query error: {str(e)}"}, "PoCs by HPE Representative"

def report_proyectos_justificacion():
    try:
        # Projects with longest justifications (assuming length indicates detail)
        proyectos_justificacion = db.session.query(
            POC.poc_id,
            ClientCompany.company_name,
            User.name,
            func.length(POC.business_justification).label('longitud_justificacion'),
            POC.business_justification
        ).join(User, User.user_id == POC.client_user_id)\
         .join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
         .filter(POC.business_justification.isnot(None))\
         .order_by(desc('longitud_justificacion')).limit(10).all()

        report_data = {
            'Projects with Most Detailed Business Justification': [
                ['PoC ID', 'Company', 'User', 'Text Length', 'Justification (first 50 chars)'],
                *[[poc_id, empresa, usuario, longitud, justificacion[:50] + "..." if justificacion and len(justificacion) > 50 else justificacion or ""]
                  for poc_id, empresa, usuario, longitud, justificacion in proyectos_justificacion]
            ]
        }
        
        return report_data, "Projects with Most Detailed Justification"
    except Exception as e:
        return {'error': str(e)}, "Error in Projects with Most Detailed Justification"
    
def report_costo_total_equipos_poc():
    try:
        # Check if there are PoCs with equipment
        pocs_con_equipos = db.session.query(func.count(func.distinct(POC.poc_id)))\
            .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
            .scalar()
        
        if pocs_con_equipos == 0:
            report_data = {
                'Information': 'No PoCs with assigned equipment to calculate costs'
            }
            return report_data, "Total Equipment Cost per PoC"

        # Calculate total cost per PoC (using equipment_items)
        costo_pocs = db.session.query(
            POC.poc_id,
            ClientCompany.company_name,
            User.name.label('usuario'),
            func.sum(EquipmentItem.qty * EquipmentItem.unit_price).label('costo_total'),
            func.count(EquipmentItem.item_id).label('total_items'),
            func.sum(EquipmentItem.qty).label('total_cantidad')
        ).join(User, User.user_id == POC.client_user_id)\
         .join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
         .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .join(EquipmentItem, EquipmentItem.solution_id == Equipment.solution_id)\
         .group_by(POC.poc_id, ClientCompany.company_name, User.name)\
         .order_by(desc('costo_total')).limit(20).all()

        # General statistics
        stats_subquery = db.session.query(
            POC.poc_id,
            func.sum(EquipmentItem.qty * EquipmentItem.unit_price).label('costo_total'),
            func.sum(EquipmentItem.qty).label('total_cantidad')
        ).join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .join(EquipmentItem, EquipmentItem.solution_id == Equipment.solution_id)\
         .group_by(POC.poc_id).subquery()

        stats = db.session.query(
            func.avg(stats_subquery.c.costo_total).label('costo_promedio'),
            func.max(stats_subquery.c.costo_total).label('costo_maximo'),
            func.min(stats_subquery.c.costo_total).label('costo_minimo'),
            func.avg(stats_subquery.c.total_cantidad).label('cantidad_promedio')
        ).first()

        # Format cost table
        tabla_costos = []
        for poc in costo_pocs:
            tabla_costos.append([
                poc.poc_id,
                poc.company_name,
                poc.usuario,
                f"${poc.costo_total:.2f}" if poc.costo_total else "$0.00",
                poc.total_items,
                poc.total_cantidad
            ])

        report_data = {
            'Cost Statistics': [
                ['Metric', 'Value'],
                ['Average Cost per PoC', f"${stats.costo_promedio:.2f}" if stats.costo_promedio else "$0.00"],
                ['Maximum Cost', f"${stats.costo_maximo:.2f}" if stats.costo_maximo else "$0.00"],
                ['Minimum Cost', f"${stats.costo_minimo:.2f}" if stats.costo_minimo else "$0.00"],
                ['Average Item Quantity', f"{stats.cantidad_promedio:.1f}" if stats.cantidad_promedio else "0"]
            ],
            'PoCs with Highest Equipment Cost (Top 20)': [
                ['PoC ID', 'Company', 'User', 'Total Cost', 'Total Items', 'Total Quantity'],
                *tabla_costos
            ]
        }
        
        return report_data, "Total Equipment Cost per PoC"
    except Exception as e:
        return {'Error': f"Error in cost calculation: {str(e)}"}, "Total Equipment Cost per PoC"

def report_total_equipos_por_solucion():
    try:
        equipos_por_solucion = db.session.query(
            Equipment.product_description,
            func.count(EquipmentItem.item_id).label('total_items'),
            func.sum(EquipmentItem.qty).label('total_cantidad'),
            func.avg(EquipmentItem.unit_price).label('precio_promedio')
        ).join(EquipmentItem, EquipmentItem.solution_id == Equipment.solution_id)\
         .group_by(Equipment.solution_id, Equipment.product_description)\
         .order_by(desc('total_cantidad')).all()

        report_data = {
            'Total Equipment by Solution': [
                ['Solution', 'Total Items', 'Total Quantity', 'Average Price'],
                *[[solucion, items, cantidad, f"${precio:.2f}"] 
                  for solucion, items, cantidad, precio in equipos_por_solucion]
            ]
        }
        
        return report_data, "Total Equipment by Solution"
    except Exception as e:
        return {'error': str(e)}, "Error in Total Equipment by Solution"

def report_equipos_mas_utilizados():
    equipos_utilizados = db.session.query(
        EquipmentItem.product_name,
        func.count(POCEquipment.poc_equipment_id).label('veces_utilizado'),
        func.sum(EquipmentItem.qty).label('total_cantidad')
    ).join(Equipment, Equipment.solution_id == EquipmentItem.solution_id)\
     .join(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)\
     .group_by(EquipmentItem.product_name)\
     .order_by(desc('veces_utilizado')).limit(15).all()

    report_data = {
        'Most Used Equipment in PoCs': [
            ['Product', 'Times Used', 'Total Quantity'],
            *[[producto, veces, cantidad] for producto, veces, cantidad in equipos_utilizados]
        ]
    }
    
    return report_data, "Most Used Equipment in PoCs"

def report_soluciones_mayor_inversion():
    soluciones_inversion = db.session.query(
        Equipment.product_description,
        func.sum(Equipment.price).label('inversion_total'),
        func.count(POCEquipment.poc_equipment_id).label('veces_utilizada')
    ).outerjoin(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)\
     .group_by(Equipment.solution_id, Equipment.product_description)\
     .order_by(desc('inversion_total')).limit(10).all()

    report_data = {
        'Solutions with Highest Investment': [
            ['Solution', 'Total Investment', 'Times Used'],
            *[[solucion, f"${inversion:.2f}", veces] for solucion, inversion, veces in soluciones_inversion]
        ]
    }
    
    return report_data, "Solutions with Highest Investment"

def report_equipamiento_promedio_poc():
    try:
        # Equipment statistics per PoC
        stats_subquery = db.session.query(
            POC.poc_id,
            func.count(POCEquipment.poc_equipment_id).label('cantidad_equipos'),
            func.sum(Equipment.price).label('valor_total'),
            func.count(func.distinct(Equipment.solution_id)).label('variedad_soluciones')
        ).join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .group_by(POC.poc_id).subquery()

        stats = db.session.query(
            func.avg(stats_subquery.c.cantidad_equipos).label('avg_cantidad'),
            func.avg(stats_subquery.c.valor_total).label('avg_valor'),
            func.avg(stats_subquery.c.variedad_soluciones).label('avg_variedad')
        ).first()

        # PoCs with most equipment
        pocs_equipamiento = db.session.query(
            POC.poc_id,
            ClientCompany.company_name,
            func.count(POCEquipment.poc_equipment_id).label('total_equipos'),
            func.sum(Equipment.price).label('valor_total')
        ).join(User, User.user_id == POC.client_user_id)\
         .join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
         .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .group_by(POC.poc_id, ClientCompany.company_name)\
         .order_by(desc('total_equipos')).limit(5).all()

        report_data = {
            'Average Equipment Statistics': [
                ['Metric', 'Value'],
                ['Average Equipment Quantity', f"{stats.avg_cantidad:.1f}"],
                ['Average Value', f"${stats.avg_valor:.2f}"],
                ['Average Solution Variety', f"{stats.avg_variedad:.1f}"]
            ],
            'PoCs with Most Equipment': [
                ['PoC ID', 'Company', 'Total Equipment', 'Total Value'],
                *[[poc_id, empresa, equipos, f"${valor:.2f}"] 
                  for poc_id, empresa, equipos, valor in pocs_equipamiento]
            ]
        }
        
        return report_data, "Average Equipment per PoC"
    except Exception as e:
        return {'error': str(e)}, "Error in Average Equipment per PoC"

def report_comparacion_soluciones_equipos():
    # Available solutions vs actually used in PoCs
    comparacion = db.session.query(
        Equipment.product_description,
        func.count(EquipmentItem.item_id).label('items_totales'),
        func.count(POCEquipment.poc_equipment_id).label('veces_usada_en_pocs'),
        (func.count(POCEquipment.poc_equipment_id) * 100.0 / func.count(EquipmentItem.item_id)).label('tasa_uso')
    ).join(EquipmentItem, EquipmentItem.solution_id == Equipment.solution_id)\
     .outerjoin(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)\
     .group_by(Equipment.solution_id, Equipment.product_description)\
     .order_by(desc('tasa_uso')).all()

    report_data = {
        'Solutions vs Equipment Used Comparison': [
            ['Solution', 'Total Items', 'Times Used', 'Usage Rate (%)'],
            *[[solucion, items_totales, veces_usada, f"{tasa_uso:.1f}%"] 
              for solucion, items_totales, veces_usada, tasa_uso in comparacion]
        ]
    }
    
    return report_data, "Solutions vs Equipment Used Comparison"

def report_usuarios_mas_pocs():
    usuarios_pocs = db.session.query(
        User.name,
        User.role,
        func.count(POC.poc_id).label('total_pocs'),
        func.sum(case((POC.is_approved == True, 1), else_=0)).label('pocs_aprobados')
    ).join(POC, POC.client_user_id == User.user_id)\
     .group_by(User.user_id, User.name, User.role)\
     .order_by(desc('total_pocs')).limit(15).all()

    report_data = {
        'Users with Most Created PoCs': [
            ['User', 'Role', 'Total PoCs', 'Approved PoCs', 'Approval Rate'],
            *[[nombre, rol, total, aprobados, f"{(aprobados/total*100):.1f}%" if total > 0 else "0%"]
              for nombre, rol, total, aprobados in usuarios_pocs]
        ]
    }
    
    return report_data, "Users with Most PoCs"

def report_relacion_usuarios_clientes():
    relacion = db.session.query(
        ClientCompany.company_name,
        func.count(User.user_id).label('total_usuarios'),
        func.count(POC.poc_id).label('total_pocs')
    ).join(User, User.client_company_id == ClientCompany.client_company_id)\
     .outerjoin(POC, POC.client_user_id == User.user_id)\
     .group_by(ClientCompany.client_company_id, ClientCompany.company_name)\
     .order_by(desc('total_usuarios')).all()

    report_data = {
        'Users and Clients Relationship': [
            ['Company', 'Total Users', 'Total PoCs', 'PoCs per User'],
            *[[empresa, usuarios, pocs, f"{(pocs/usuarios):.1f}" if usuarios > 0 else "0"]
              for empresa, usuarios, pocs in relacion]
        ]
    }
    
    return report_data, "Users and Clients Relationship"

def report_usuarios_internos_externos():
    usuarios_por_rol = db.session.query(
        User.role,
        func.count(User.user_id).label('total_usuarios'),
        func.sum(case((User.session_started == True, 1), else_=0)).label('usuarios_activos')
    ).group_by(User.role).all()

    total_usuarios = sum([total for rol, total, activos in usuarios_por_rol])
    
    report_data = {
        'User Distribution by Role': [
            ['Role', 'Total Users', 'Active Users', '% of Total'],
            *[[rol, total, activos, f"{(total/total_usuarios*100):.1f}%"] 
              for rol, total, activos in usuarios_por_rol]
        ]
    }
    
    return report_data, "Internal vs External Users"

def report_usuarios_activos():
    usuarios_activos = db.session.query(
        User.name,
        User.role,
        ClientCompany.company_name,
        func.count(POC.poc_id).label('pocs_creados')
    ).join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
     .outerjoin(POC, POC.client_user_id == User.user_id)\
     .filter(User.session_started == True)\
     .group_by(User.user_id, User.name, User.role, ClientCompany.company_name)\
     .order_by(desc('pocs_creados')).all()

    report_data = {
        'Users with Active Session': [
            ['User', 'Role', 'Company', 'Created PoCs'],
            *[[nombre, rol, empresa, pocs] for nombre, rol, empresa, pocs in usuarios_activos]
        ]
    }
    
    return report_data, "Active Users"

def report_costo_total_poc():
    try:
        # Calculate total cost based on equipment_items (qty * unit_price)
        costo_pocs = db.session.query(
            POC.poc_id,
            ClientCompany.company_name,
            User.name.label('usuario'),
            func.sum(EquipmentItem.qty * EquipmentItem.unit_price).label('costo_total'),
            func.count(EquipmentItem.item_id).label('total_items')
        ).join(User, User.user_id == POC.client_user_id)\
         .join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
         .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .join(EquipmentItem, EquipmentItem.solution_id == Equipment.solution_id)\
         .group_by(POC.poc_id, ClientCompany.company_name, User.name)\
         .order_by(desc('costo_total')).limit(20).all()

        # General statistics
        stats_subquery = db.session.query(
            POC.poc_id,
            func.sum(EquipmentItem.qty * EquipmentItem.unit_price).label('costo_total')
        ).join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .join(EquipmentItem, EquipmentItem.solution_id == Equipment.solution_id)\
         .group_by(POC.poc_id).subquery()

        stats = db.session.query(
            func.avg(stats_subquery.c.costo_total).label('costo_promedio'),
            func.max(stats_subquery.c.costo_total).label('costo_maximo'),
            func.min(stats_subquery.c.costo_total).label('costo_minimo')
        ).first()

        report_data = {
            'Cost Statistics': [
                ['Metric', 'Value'],
                ['Average Cost per PoC', f"${stats.costo_promedio:.2f}" if stats.costo_promedio else "$0.00"],
                ['Maximum Cost', f"${stats.costo_maximo:.2f}" if stats.costo_maximo else "$0.00"],
                ['Minimum Cost', f"${stats.costo_minimo:.2f}" if stats.costo_minimo else "$0.00"]
            ],
            'PoCs with Highest Cost': [
                ['PoC ID', 'Company', 'User', 'Total Cost', 'Total Items'],
                *[[poc_id, empresa, usuario, f"${costo:.2f}", items] 
                  for poc_id, empresa, usuario, costo, items in costo_pocs]
            ]
        }
        
        return report_data, "Total Cost per PoC"
    except Exception as e:
        return {'error': str(e)}, "Error in Total Cost per PoC"

def report_soluciones_mas_caras():
    soluciones_caras = db.session.query(
        Equipment.product_description,
        Equipment.price,
        func.count(POCEquipment.poc_equipment_id).label('veces_utilizada')
    ).outerjoin(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)\
     .group_by(Equipment.solution_id, Equipment.product_description, Equipment.price)\
     .order_by(desc(Equipment.price)).limit(15).all()

    report_data = {
        'Most Expensive Solutions': [
            ['Solution', 'Price', 'Times Used'],
            *[[solucion, f"${precio:.2f}", veces] for solucion, precio, veces in soluciones_caras]
        ]
    }
    
    return report_data, "Most Expensive Solutions"

def report_pocs_mayor_inversion():
    pocs_inversion = db.session.query(
        POC.poc_id,
        ClientCompany.company_name,
        User.name.label('usuario'),
        func.sum(Equipment.price).label('inversion_total'),
        func.count(POCEquipment.poc_equipment_id).label('total_equipos')
    ).join(User, User.user_id == POC.client_user_id)\
     .join(ClientCompany, ClientCompany.client_company_id == User.client_company_id)\
     .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
     .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
     .group_by(POC.poc_id, ClientCompany.company_name, User.name)\
     .order_by(desc('inversion_total')).limit(15).all()

    report_data = {
        'PoCs with Highest Equipment Investment': [
            ['PoC ID', 'Company', 'User', 'Total Investment', 'Total Equipment'],
            *[[poc_id, empresa, usuario, f"${inversion:.2f}", equipos] 
              for poc_id, empresa, usuario, inversion, equipos in pocs_inversion]
        ]
    }
    
    return report_data, "PoCs with Highest Investment"

def report_empresa_mayor_inversion():
    empresa_inversion = db.session.query(
        ClientCompany.company_name,
        func.sum(Equipment.price).label('inversion_total'),
        func.count(POC.poc_id).label('total_pocs'),
        func.count(POCEquipment.poc_equipment_id).label('total_equipos')
    ).join(User, User.client_company_id == ClientCompany.client_company_id)\
     .join(POC, POC.client_user_id == User.user_id)\
     .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
     .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
     .group_by(ClientCompany.client_company_id, ClientCompany.company_name)\
     .order_by(desc('inversion_total')).all()

    report_data = {
        'Companies with Highest Equipment Investment': [
            ['Company', 'Total Investment', 'Total PoCs', 'Total Equipment', 'Average Investment per PoC'],
            *[[empresa, f"${inversion:.2f}", pocs, equipos, f"${(inversion/pocs):.2f}" if pocs > 0 else "$0.00"]
              for empresa, inversion, pocs, equipos in empresa_inversion]
        ]
    }
    
    return report_data, "Company with Highest Investment"

def report_tendencias_aprobaciones():
    from datetime import datetime, timedelta
    
    # Last 6 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    tendencias = db.session.query(
        func.date_trunc('month', POC.created_date).label('mes'),
        func.count(POC.poc_id).label('total_pocs'),
        func.sum(case((POC.is_approved == True, 1), else_=0)).label('pocs_aprobados'),
        (func.sum(case((POC.is_approved == True, 1), else_=0)) * 100.0 / func.count(POC.poc_id)).label('tasa_aprobacion')
    ).filter(POC.created_date >= start_date)\
     .group_by(func.date_trunc('month', POC.created_date))\
     .order_by('mes').all()

    report_data = {
        'Approval Trends (Last 6 Months)': [
            ['Month', 'Total PoCs', 'Approved PoCs', 'Approval Rate'],
            *[[mes.strftime('%Y-%m'), total, aprobados, f"{tasa:.1f}%"] 
              for mes, total, aprobados, tasa in tendencias]
        ]
    }
    
    return report_data, "Approval Trends"