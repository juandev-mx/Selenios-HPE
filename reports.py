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
            return jsonify({'error': 'Tipo de reporte no válido'}), 400
        
        report_data, report_title = report_functions[report_type]()
        pdf_buffer = create_pdf_report(report_data, report_title)
        
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=reporte_{report_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def report_total_empresas():
    try:
        total_empresas = db.session.query(func.count(ClientCompany.client_company_id)).scalar()
        
        # Obtener detalle de empresas formateado correctamente
        detalle_empresas = db.session.query(
            ClientCompany.client_company_id,
            ClientCompany.company_name,
            ClientCompany.manager_client_name,
            func.count(User.user_id).label('total_usuarios')
        ).outerjoin(User, User.client_company_id == ClientCompany.client_company_id)\
         .group_by(ClientCompany.client_company_id, ClientCompany.company_name, ClientCompany.manager_client_name).all()

        # Convertir resultados a lista de listas
        detalle_lista = []
        for empresa in detalle_empresas:
            detalle_lista.append([
                empresa.client_company_id,
                empresa.company_name,
                empresa.manager_client_name or 'No asignado',
                empresa.total_usuarios
            ])

        report_data = {
            'Resumen General': f"Total de empresas registradas en el sistema: {total_empresas}",
            'Detalle por Empresa': [
                ['ID Empresa', 'Nombre Empresa', 'Gerente', 'Total Usuarios'],
                *detalle_lista
            ]
        }
        
        return report_data, "Total de Empresas Registradas"
    except Exception as e:
        return {'error': str(e)}, "Error en Total de Empresas"

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

# reporte de Tiempo Promedio de Ejecución
def report_tiempo_promedio_pocs():
    try:
        # Calcular tiempo promedio de ejecución (completion_date - created_date) por cliente
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
            'Tiempo Promedio de Ejecución por Cliente': [
                ['Empresa', 'Tiempo Promedio (días)'],
                *[[empresa, f"{(tiempo/86400):.1f} días" if tiempo else "Sin datos"] 
                  for empresa, tiempo in tiempo_promedio]
            ]
        }
        
        return report_data, "Tiempo Promedio de Ejecución por Cliente"
    except Exception as e:
        return {'error': str(e)}, "Error en Tiempo Promedio de Ejecución"

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

# Reportes faltantes - PoCs Aprobados vs No Aprobados
def report_pocs_aprobados_vs_no():
    try:
        total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
        aprobados = db.session.query(func.count(POC.poc_id)).filter(POC.is_approved == True).scalar()
        rechazados = db.session.query(func.count(POC.poc_id)).filter(POC.is_approved == False).scalar()
        pendientes = total_pocs - aprobados - rechazados

        report_data = {
            'Distribución de PoCs por Estado de Aprobación': [
                ['Estado', 'Cantidad', 'Porcentaje'],
                ['Aprobados', aprobados, f"{(aprobados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Rechazados', rechazados, f"{(rechazados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Pendientes', pendientes, f"{(pendientes/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Total', total_pocs, '100%']
            ]
        }
        
        return report_data, "PoCs Aprobados vs No Aprobados"
    except Exception as e:
        return {'error': str(e)}, "Error en PoCs Aprobados vs No Aprobados"

# PoCs en Curso vs Completados
def report_pocs_curso_vs_completados():
    try:
        total_pocs = db.session.query(func.count(POC.poc_id)).scalar()
        completados = db.session.query(func.count(POC.poc_id)).filter(POC.completion_date.isnot(None)).scalar()
        en_curso = total_pocs - completados

        report_data = {
            'PoCs en Curso vs Completados': [
                ['Estado', 'Cantidad', 'Porcentaje'],
                ['Completados', completados, f"{(completados/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['En Curso', en_curso, f"{(en_curso/total_pocs*100):.1f}%" if total_pocs > 0 else "0%"],
                ['Total', total_pocs, '100%']
            ]
        }
        
        return report_data, "PoCs en Curso vs Completados"
    except Exception as e:
        return {'error': str(e)}, "Error en PoCs en Curso vs Completados"

# Tiempo Promedio de Completado
def report_tiempo_promedio_completado():
    try:
        # Primero verificar si hay PoCs completados
        pocs_completados = db.session.query(func.count(POC.poc_id)).filter(
            POC.completion_date.isnot(None)
        ).scalar()
        
        if pocs_completados == 0:
            report_data = {
                'Información': 'No hay PoCs completados para calcular tiempos',
                'Detalle': 'Todos los PoCs están pendientes de completar o no tienen fecha de completado.'
            }
            return report_data, "Tiempo Promedio de Completado"

        # Calcular tiempo promedio usando diferencia directa de fechas
        tiempo_promedio = db.session.query(
            func.avg(POC.completion_date - POC.created_date)
        ).filter(POC.completion_date.isnot(None)).scalar()

        # PoCs con mayor tiempo de completado
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

        # Formatear los datos para la tabla
        tabla_tiempos = []
        for poc in tiempos_extremos:
            dias = poc.tiempo_duracion.days if poc.tiempo_duracion else 0
            tabla_tiempos.append([
                poc.poc_id,
                poc.company_name,
                poc.name,
                f"{dias} días",
                poc.created_date.strftime('%Y-%m-%d') if poc.created_date else 'N/A',
                poc.completion_date.strftime('%Y-%m-%d') if poc.completion_date else 'N/A'
            ])

        # Calcular tiempo promedio en días
        tiempo_promedio_dias = tiempo_promedio.days if tiempo_promedio else 0

        report_data = {
            'Resumen': f"Tiempo promedio de completado: {tiempo_promedio_dias} días (basado en {pocs_completados} PoCs completados)",
            'PoCs con Mayor Tiempo de Completado': [
                ['PoC ID', 'Empresa', 'Usuario', 'Duración', 'Fecha Inicio', 'Fecha Completado'],
                *tabla_tiempos
            ]
        }
        
        return report_data, "Tiempo Promedio de Completado"
    except Exception as e:
        return {'Error': f"Error al calcular tiempos: {str(e)}"}, "Tiempo Promedio de Completado"

# PoCs por Representante HPE
def report_pocs_por_representante():
    try:
        # Primero verificar si hay representantes HPE
        total_reps = db.session.query(func.count(User.user_id)).filter(
            User.role == 'HPE_REP'
        ).scalar()
        
        if total_reps == 0:
            report_data = {
                'Información': 'No hay representantes HPE registrados en el sistema'
            }
            return report_data, "PoCs por Representante HPE"

        # Consulta para PoCs por representante HPE
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

        # Formatear los datos
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
            'Resumen': f"Total de representantes HPE: {total_reps}",
            'PoCs por Representante HPE': [
                ['Representante', 'Email', 'Total PoCs', 'Aprobados', 'Rechazados', 'Pendientes', 'Completados', 'Tasa Aprobación'],
                *tabla_reps
            ]
        }
        
        return report_data, "PoCs por Representante HPE"
    except Exception as e:
        return {'Error': f"Error en la consulta: {str(e)}"}, "PoCs por Representante HPE"

# Proyectos con Mayor Justificación
def report_proyectos_justificacion():
    try:
        # Proyectos con justificaciones más largas (asumiendo que longitud indica detalle)
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
            'Proyectos con Mayor Justificación de Negocio': [
                ['PoC ID', 'Empresa', 'Usuario', 'Longitud Texto', 'Justificación (primeros 50 chars)'],
                *[[poc_id, empresa, usuario, longitud, justificacion[:50] + "..." if justificacion and len(justificacion) > 50 else justificacion or ""]
                  for poc_id, empresa, usuario, longitud, justificacion in proyectos_justificacion]
            ]
        }
        
        return report_data, "Proyectos con Mayor Justificación"
    except Exception as e:
        return {'error': str(e)}, "Error en Proyectos con Mayor Justificación"
    
#Costo total de Equipos por Solución
def report_costo_total_equipos_poc():
    try:
        # Verificar si hay PoCs con equipos
        pocs_con_equipos = db.session.query(func.count(func.distinct(POC.poc_id)))\
            .join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
            .scalar()
        
        if pocs_con_equipos == 0:
            report_data = {
                'Información': 'No hay PoCs con equipos asignados para calcular costos'
            }
            return report_data, "Costo Total de Equipos por PoC"

        # Calcular costo total por PoC (usando equipment_items)
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

        # Estadísticas generales
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

        # Formatear la tabla de costos
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
            'Estadísticas de Costos': [
                ['Métrica', 'Valor'],
                ['Costo Promedio por PoC', f"${stats.costo_promedio:.2f}" if stats.costo_promedio else "$0.00"],
                ['Costo Máximo', f"${stats.costo_maximo:.2f}" if stats.costo_maximo else "$0.00"],
                ['Costo Mínimo', f"${stats.costo_minimo:.2f}" if stats.costo_minimo else "$0.00"],
                ['Cantidad Promedio de Items', f"{stats.cantidad_promedio:.1f}" if stats.cantidad_promedio else "0"]
            ],
            'PoCs con Mayor Costo de Equipos (Top 20)': [
                ['PoC ID', 'Empresa', 'Usuario', 'Costo Total', 'Total Items', 'Cantidad Total'],
                *tabla_costos
            ]
        }
        
        return report_data, "Costo Total de Equipos por PoC"
    except Exception as e:
        return {'Error': f"Error en el cálculo de costos: {str(e)}"}, "Costo Total de Equipos por PoC"

# Total de Equipos por Solución
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
            'Total de Equipos por Solución': [
                ['Solución', 'Total Items', 'Cantidad Total', 'Precio Promedio'],
                *[[solucion, items, cantidad, f"${precio:.2f}"] 
                  for solucion, items, cantidad, precio in equipos_por_solucion]
            ]
        }
        
        return report_data, "Total de Equipos por Solución"
    except Exception as e:
        return {'error': str(e)}, "Error en Total de Equipos por Solución"


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
        'Equipos Más Utilizados en PoCs': [
            ['Producto', 'Veces Utilizado', 'Cantidad Total'],
            *[[producto, veces, cantidad] for producto, veces, cantidad in equipos_utilizados]
        ]
    }
    
    return report_data, "Equipos Más Utilizados en PoCs"

def report_soluciones_mayor_inversion():
    soluciones_inversion = db.session.query(
        Equipment.product_description,
        func.sum(Equipment.price).label('inversion_total'),
        func.count(POCEquipment.poc_equipment_id).label('veces_utilizada')
    ).outerjoin(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)\
     .group_by(Equipment.solution_id, Equipment.product_description)\
     .order_by(desc('inversion_total')).limit(10).all()

    report_data = {
        'Soluciones con Mayor Inversión': [
            ['Solución', 'Inversión Total', 'Veces Utilizada'],
            *[[solucion, f"${inversion:.2f}", veces] for solucion, inversion, veces in soluciones_inversion]
        ]
    }
    
    return report_data, "Soluciones con Mayor Inversión"

def report_equipamiento_promedio_poc():
    # Estadísticas de equipamiento por PoC
    stats = db.session.query(
        func.avg(equip_count).label('avg_equipos_por_poc'),
        func.avg(total_costo).label('avg_costo_por_poc'),
        func.avg(variedad_equipos).label('avg_variedad_por_poc')
    ).select_from(
        db.session.query(
            POC.poc_id,
            func.count(POCEquipment.poc_equipment_id).label('equip_count'),
            func.sum(Equipment.price).label('total_costo'),
            func.count(func.distinct(Equipment.solution_id)).label('variedad_equipos')
        ).join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
         .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
         .group_by(POC.poc_id).subquery()
    ).first()

    # Top PoCs con más equipamiento
    top_pocs_equipamiento = db.session.query(
        POC.poc_id,
        func.count(POCEquipment.poc_equipment_id).label('total_equipos'),
        func.sum(Equipment.price).label('costo_total')
    ).join(POCEquipment, POCEquipment.poc_id == POC.poc_id)\
     .join(Equipment, Equipment.solution_id == POCEquipment.solution_id)\
     .group_by(POC.poc_id)\
     .order_by(desc('total_equipos')).limit(5).all()

    report_data = {
        'Estadísticas Promedio': [
            ['Métrica', 'Valor'],
            ['Equipos Promedio por PoC', f"{stats.avg_equipos_por_poc:.1f}"],
            ['Costo Promedio por PoC', f"${stats.avg_costo_por_poc:.2f}"],
            ['Variedad Promedio de Equipos', f"{stats.avg_variedad_por_poc:.1f}"]
        ],
        'PoCs con Mayor Equipamiento': [
            ['PoC ID', 'Total Equipos', 'Costo Total'],
            *[[poc_id, total_equipos, f"${costo_total:.2f}"] for poc_id, total_equipos, costo_total in top_pocs_equipamiento]
        ]
    }
    
    return report_data, "Equipamiento Promedio por PoC"

# Equipamiento Promedio por PoC
def report_equipamiento_promedio_poc():
    try:
        # Estadísticas de equipamiento por PoC
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

        # PoCs con mayor equipamiento
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
            'Estadísticas de Equipamiento Promedio': [
                ['Métrica', 'Valor'],
                ['Cantidad Promedio de Equipos', f"{stats.avg_cantidad:.1f}"],
                ['Valor Promedio', f"${stats.avg_valor:.2f}"],
                ['Variedad Promedio de Soluciones', f"{stats.avg_variedad:.1f}"]
            ],
            'PoCs con Mayor Equipamiento': [
                ['PoC ID', 'Empresa', 'Total Equipos', 'Valor Total'],
                *[[poc_id, empresa, equipos, f"${valor:.2f}"] 
                  for poc_id, empresa, equipos, valor in pocs_equipamiento]
            ]
        }
        
        return report_data, "Equipamiento Promedio por PoC"
    except Exception as e:
        return {'error': str(e)}, "Error en Equipamiento Promedio por PoC"

def report_comparacion_soluciones_equipos():
    # Soluciones disponibles vs realmente usadas en PoCs
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
        'Comparación Soluciones vs Equipos Usados': [
            ['Solución', 'Items Totales', 'Veces Usada', 'Tasa de Uso (%)'],
            *[[solucion, items_totales, veces_usada, f"{tasa_uso:.1f}%"] 
              for solucion, items_totales, veces_usada, tasa_uso in comparacion]
        ]
    }
    
    return report_data, "Comparación Soluciones vs Equipos Usados"

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
        'Usuarios con Más PoCs Creados': [
            ['Usuario', 'Rol', 'Total PoCs', 'PoCs Aprobados', 'Tasa Aprobación'],
            *[[nombre, rol, total, aprobados, f"{(aprobados/total*100):.1f}%" if total > 0 else "0%"]
              for nombre, rol, total, aprobados in usuarios_pocs]
        ]
    }
    
    return report_data, "Usuarios con Más PoCs"

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
        'Relación Usuarios y Clientes': [
            ['Empresa', 'Total Usuarios', 'Total PoCs', 'PoCs por Usuario'],
            *[[empresa, usuarios, pocs, f"{(pocs/usuarios):.1f}" if usuarios > 0 else "0"]
              for empresa, usuarios, pocs in relacion]
        ]
    }
    
    return report_data, "Relación Usuarios y Clientes"

def report_usuarios_internos_externos():
    usuarios_por_rol = db.session.query(
        User.role,
        func.count(User.user_id).label('total_usuarios'),
        func.sum(case((User.session_started == True, 1), else_=0)).label('usuarios_activos')
    ).group_by(User.role).all()

    total_usuarios = sum([total for rol, total, activos in usuarios_por_rol])
    
    report_data = {
        'Distribución de Usuarios por Rol': [
            ['Rol', 'Total Usuarios', 'Usuarios Activos', '% del Total'],
            *[[rol, total, activos, f"{(total/total_usuarios*100):.1f}%"] 
              for rol, total, activos in usuarios_por_rol]
        ]
    }
    
    return report_data, "Usuarios Internos vs Externos"

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
        'Usuarios con Sesión Activa': [
            ['Usuario', 'Rol', 'Empresa', 'PoCs Creados'],
            *[[nombre, rol, empresa, pocs] for nombre, rol, empresa, pocs in usuarios_activos]
        ]
    }
    
    return report_data, "Usuarios Activos"

def report_costo_total_poc():
    try:
        # Calcular costo total basado en equipment_items (qty * unit_price)
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

        # Estadísticas generales
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
            'Estadísticas de Costos': [
                ['Métrica', 'Valor'],
                ['Costo Promedio por PoC', f"${stats.costo_promedio:.2f}" if stats.costo_promedio else "$0.00"],
                ['Costo Máximo', f"${stats.costo_maximo:.2f}" if stats.costo_maximo else "$0.00"],
                ['Costo Mínimo', f"${stats.costo_minimo:.2f}" if stats.costo_minimo else "$0.00"]
            ],
            'PoCs con Mayor Costo': [
                ['PoC ID', 'Empresa', 'Usuario', 'Costo Total', 'Total Items'],
                *[[poc_id, empresa, usuario, f"${costo:.2f}", items] 
                  for poc_id, empresa, usuario, costo, items in costo_pocs]
            ]
        }
        
        return report_data, "Costo Total por PoC"
    except Exception as e:
        return {'error': str(e)}, "Error en Costo Total por PoC"

def report_soluciones_mas_caras():
    soluciones_caras = db.session.query(
        Equipment.product_description,
        Equipment.price,
        func.count(POCEquipment.poc_equipment_id).label('veces_utilizada')
    ).outerjoin(POCEquipment, POCEquipment.solution_id == Equipment.solution_id)\
     .group_by(Equipment.solution_id, Equipment.product_description, Equipment.price)\
     .order_by(desc(Equipment.price)).limit(15).all()

    report_data = {
        'Soluciones Más Caras': [
            ['Solución', 'Precio', 'Veces Utilizada'],
            *[[solucion, f"${precio:.2f}", veces] for solucion, precio, veces in soluciones_caras]
        ]
    }
    
    return report_data, "Soluciones Más Caras"

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
        'PoCs con Mayor Inversión en Equipos': [
            ['PoC ID', 'Empresa', 'Usuario', 'Inversión Total', 'Total Equipos'],
            *[[poc_id, empresa, usuario, f"${inversion:.2f}", equipos] 
              for poc_id, empresa, usuario, inversion, equipos in pocs_inversion]
        ]
    }
    
    return report_data, "PoCs con Mayor Inversión"

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
        'Empresas con Mayor Inversión en Equipos': [
            ['Empresa', 'Inversión Total', 'Total PoCs', 'Total Equipos', 'Inversión Promedio por PoC'],
            *[[empresa, f"${inversion:.2f}", pocs, equipos, f"${(inversion/pocs):.2f}" if pocs > 0 else "$0.00"]
              for empresa, inversion, pocs, equipos in empresa_inversion]
        ]
    }
    
    return report_data, "Empresa con Mayor Inversión"

# Función adicional para reporte de tendencias de aprobaciones (si no la tienes)
def report_tendencias_aprobaciones():
    from datetime import datetime, timedelta
    
    # Últimos 6 meses
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
        'Tendencias de Aprobación (Últimos 6 Meses)': [
            ['Mes', 'Total PoCs', 'PoCs Aprobados', 'Tasa de Aprobación'],
            *[[mes.strftime('%Y-%m'), total, aprobados, f"{tasa:.1f}%"] 
              for mes, total, aprobados, tasa in tendencias]
        ]
    }
    
    return report_data, "Tendencias de Aprobación"