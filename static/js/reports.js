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
        // Guardar el estado original
        const originalText = buttonElement.textContent;
        let resetTimeout;
        
        try {
            // Cambiar el estado del botón
            buttonElement.textContent = 'Generando...';
            buttonElement.disabled = true;

            // Timeout de respaldo para restaurar el botón después de 3 segundos
            resetTimeout = setTimeout(() => {
                console.log('Restaurando botón por timeout');
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 3000);

            const response = await fetch(`/api/reports/${reportType}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }

            // Verificar que sea un PDF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('El servidor no devolvió un PDF válido');
            }

            const blob = await response.blob();
            
            // Crear y disparar la descarga
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Limpiar después de la descarga
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

        } catch (error) {
            console.error('Error generando reporte:', error);
            alert(`Error al generar el reporte: ${error.message}`);
        } finally {
            // Limpiar el timeout de respaldo si existe
            if (resetTimeout) {
                clearTimeout(resetTimeout);
            }
            
            // Restaurar el botón inmediatamente
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }
    }
}

// Inicializar cuando la página cargue
document.addEventListener('DOMContentLoaded', () => {
    new ReportManager();
});