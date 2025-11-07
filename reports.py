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

reports_bp = Blueprint('reports', __name__)

# Estilos para el PDF
def get_styles():
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#00263B'),
        spaceAfter=30,
        alignment=1  # Centrado
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
    
    # Título del reporte
    elements.append(Paragraph(f"Reporte: {report_title}", title_style))
    elements.append(Paragraph(f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}", subtitle_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Contenido del reporte
    for section_title, data in report_data.items():
        elements.append(Paragraph(section_title, heading_style))
        
        if isinstance(data, list) and all(isinstance(row, (list, tuple)) for row in data):
            # Es una tabla
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
            # Es texto simple
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
            'total_pocs': report_total_pocs
            
            #,
            
            #'pocs_aprobados_vs_no': report_pocs_aprobados_vs_no,
            # 'pocs_curso_vs_completados': report_pocs_curso_vs_completados,
            # 'tiempo_promedio_completado': report_tiempo_promedio_completado,
            # 'pocs_por_representante': report_pocs_por_representante,
            # 'proyectos_justificacion': report_proyectos_justificacion,
            # 'total_equipos_por_solucion': report_total_equipos_por_solucion,
            # 'costo_total_equipos_poc': report_costo_total_equipos_poc,
            # 'equipos_mas_utilizados': report_equipos_mas_utilizados,
            # 'soluciones_mayor_inversion': report_soluciones_mayor_inversion,
            # 'equipamiento_promedio_poc': report_equipamiento_promedio_poc,
            # 'comparacion_soluciones_equipos': report_comparacion_soluciones_equipos,
            # 'usuarios_mas_pocs': report_usuarios_mas_pocs,
            # 'relacion_usuarios_clientes': report_relacion_usuarios_clientes,
            # 'usuarios_internos_externos': report_usuarios_internos_externos,
            # 'usuarios_activos': report_usuarios_activos,
            # 'costo_total_poc': report_costo_total_poc,
            # 'soluciones_mas_caras': report_soluciones_mas_caras,
            # 'pocs_mayor_inversion': report_pocs_mayor_inversion,
            # 'empresa_mayor_inversion': report_empresa_mayor_inversion
        
        }
        
        if report_type not in report_functions:
            return jsonify({'error': 'Tipo de reporte no válido'}), 400
        
        report_data, report_title = report_functions[report_type]()
        pdf_buffer = create_pdf_report(report_data, report_title)
        
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=reporte_{report_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Funciones de reportes específicos
def report_total_empresas():
    total_empresas = db.session.query(func.count(ClientCompany.client_company_id)).scalar()
    
    report_data = {
        'Resumen General': f"Total de empresas registradas en el sistema: {total_empresas}",
        'Detalle por Empresa': [
            ['ID Empresa', 'Nombre Empresa', 'Gerente', 'Total Usuarios'],
            *db.session.query(
                ClientCompany.client_company_id,
                ClientCompany.company_name,
                ClientCompany.manager_client_name,
                func.count(User.user_id)
            ).outerjoin(User, User.client_company_id == ClientCompany.client_company_id)
            .group_by(ClientCompany.client_company_id).all()
        ]
    }
    
    return report_data, "Total de Empresas Registradas"

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
        'PoCs por Empresa': [
            ['Empresa', 'Total PoCs', 'Aprobados', 'Rechazados', 'Pendientes'],
            *[[empresa, total, aprobados, rechazados, total - aprobados - rechazados] 
              for empresa, total, aprobados, rechazados in pocs_por_empresa]
        ]
    }
    
    return report_data, "PoCs por Empresa"

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
        'Tasa de Aprobación por Empresa': [
            ['Empresa', 'Total PoCs', 'PoCs Aprobados', 'Tasa Aprobación (%)'],
            *[[empresa, total, aprobados, f"{tasa:.2f}%"] 
              for empresa, total, aprobados, tasa in tasa_aprobacion]
        ]
    }
    
    return report_data, "Tasa de Aprobación por Empresa"

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
        'Clientes con más PoCs Completados': [
            ['Empresa', 'Total PoCs', 'Completados', 'En Curso', '% Completados'],
            *[[empresa, total, completados, en_curso, f"{(completados/total*100):.1f}%" if total > 0 else "0%"]
              for empresa, total, completados, en_curso in clientes_pocs]
        ]
    }
    
    return report_data, "Clientes con más PoCs Completados"

def report_tiempo_promedio_pocs():
    tiempo_promedio = db.session.query(
        ClientCompany.company_name,
        func.avg(POC.completion_date - POC.created_date).label('tiempo_promedio')
    ).join(User, User.client_company_id == ClientCompany.client_company_id)\
     .join(POC, POC.client_user_id == User.user_id)\
     .filter(POC.completion_date.isnot(None))\
     .group_by(ClientCompany.company_name).all()
    
    report_data = {
        'Tiempo Promedio de Ejecución por Cliente': [
            ['Empresa', 'Tiempo Promedio (días)'],
            *[[empresa, f"{tiempo.days if tiempo else 0} días"] 
              for empresa, tiempo in tiempo_promedio]
        ]
    }
    
    return report_data, "Tiempo Promedio de Ejecución por Cliente"

# Continuar con las demás funciones de reporte...
# (Aquí irían las implementaciones de los otros reportes)

def report_total_pocs():
    total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
    pocs_aprobados = db.session.query(func.count(POC.poc_id)).filter(POC.is_approved == True).scalar()
    pocs_completados = db.session.query(func.count(POC.poc_id)).filter(POC.completion_date.isnot(None)).scalar()
    
    report_data = {
        'Resumen General': f"Total de PoCs en el sistema: {total_pocs}",
        'Estadísticas Detalladas': [
            ['Métrica', 'Valor'],
            ['Total PoCs', total_pocs],
            ['PoCs Aprobados', pocs_aprobados],
            ['PoCs Completados', pocs_completados],
            ['Tasa de Aprobación', f"{(pocs_aprobados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
            ['Tasa de Completado', f"{(pocs_completados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"]
        ]
    }
    
    return report_data, "Total de PoCs Registrados"

# Implementar las demás funciones de reporte de manera similar...