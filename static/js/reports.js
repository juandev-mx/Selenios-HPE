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
        
        const originalText = buttonElement.textContent;
        let resetTimeout;
        
        try {
            
            buttonElement.textContent = 'Generando...';
            buttonElement.disabled = true;

            
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

            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('El servidor no devolvió un PDF válido');
            }

            const blob = await response.blob();
            
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

        } catch (error) {
            console.error('Error generando reporte:', error);
            alert(`Error al generar el reporte: ${error.message}`);
        } finally {
            
            if (resetTimeout) {
                clearTimeout(resetTimeout);
            }
            
            
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new ReportManager();
});