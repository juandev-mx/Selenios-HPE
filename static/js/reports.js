// static/js/reports.js
class ReportManager {
    constructor() {
        this.initReportEvents();
    }

    initReportEvents() {
        const reportButtons = document.querySelectorAll('.report-btn');
        
        reportButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const reportType = e.target.getAttribute('data-report');
                this.generateReport(reportType, e.target);
            });
        });
    }

    async generateReport(reportType, buttonElement) {
        try {
            // Mostrar indicador de carga
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Generando...';
            buttonElement.disabled = true;

            const response = await fetch(`/api/reports/${reportType}`);
            
            if (!response.ok) {
                throw new Error('Error al generar el reporte');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error generando reporte:', error);
            alert('Error al generar el reporte. Por favor, intenta nuevamente.');
        } finally {
            // Restaurar el botón
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }
    }
}

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    new ReportManager();
});