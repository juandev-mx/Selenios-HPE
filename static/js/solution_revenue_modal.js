class SolutionRevenueModal {
    constructor() {
        this.currentPage = 0;
        this.itemsPerPage = 25;
        this.allData = [];
        this.chart = null;
        this.init();
    }

    init() {
        this.createModalHTML();
        this.attachEventListeners();
        this.setupResizeHandler();
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.chart && document.getElementById('solutionRevenueModal').classList.contains('active')) {
                    this.renderChart();
                }
            }, 250);
        });
    }

    createModalHTML() {
        const modalHTML = `
            <div id="solutionRevenueModal" class="solution-modal">
                <div class="solution-modal-content">
                    <div class="solution-modal-header">
                        <h2>Solution Revenue - Complete View</h2>
                        <button class="solution-modal-close">&times;</button>
                    </div>
                    <div class="solution-modal-body">
                        <canvas id="solutionModalChart"></canvas>
                        <div class="solution-pagination">
                            <button id="solutionPrevPageBtn" class="pagination-btn" disabled>
                                ← Previous
                            </button>
                            <span id="solutionPageInfo" class="page-info">Page 1</span>
                            <button id="solutionNextPageBtn" class="pagination-btn">
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (!document.getElementById('solutionRevenueModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    attachEventListeners() {
        const modal = document.getElementById('solutionRevenueModal');
        const closeBtn = modal.querySelector('.solution-modal-close');
        const prevBtn = document.getElementById('solutionPrevPageBtn');
        const nextBtn = document.getElementById('solutionNextPageBtn');

        closeBtn.addEventListener('click', () => this.close());
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });

        prevBtn.addEventListener('click', () => this.previousPage());
        nextBtn.addEventListener('click', () => this.nextPage());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    async open() {
        try {
            console.log('🔄 Opening Solution Revenue modal...');
            const data = await this.fetchAllSolutionData();
            console.log('📊 Data fetched:', data.length, 'items');
            
            this.allData = data;
            this.currentPage = 0;
            
            const modal = document.getElementById('solutionRevenueModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // ✅ IMPORTANTE: Renderizar después de que el modal sea visible
            setTimeout(() => {
                this.renderChart();
            }, 100);
            
        } catch (error) {
            console.error('❌ Error opening modal:', error);
            notify.error('Could not load solution data', { title: 'Error' });
        }
    }

    close() {
        const modal = document.getElementById('solutionRevenueModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    async fetchAllSolutionData() {
        const [equipmentResponse, pocEquipmentResponse] = await Promise.all([
            fetch('/equipment'),
            fetch('/poc_equipment')
        ]);

        const equipment = await equipmentResponse.json();
        const pocEquipment = await pocEquipmentResponse.json();

        const solutionUsage = {};
        pocEquipment.forEach(pe => {
            solutionUsage[pe.solution_id] = (solutionUsage[pe.solution_id] || 0) + 1;
        });

        const solutions = equipment.map(eq => ({
            solution_id: eq.solution_id,
            name: eq.product_description || eq.product_number || 'N/A',
            product_number: eq.product_number || 'N/A',
            revenue: parseFloat(eq.price || 0) * (solutionUsage[eq.solution_id] || 0),
            usage: solutionUsage[eq.solution_id] || 0
        }));

        const usedSolutions = solutions.filter(s => s.usage > 0);
        usedSolutions.sort((a, b) => a.name.localeCompare(b.name));

        return usedSolutions;
    }

    renderChart() {
        const startIdx = this.currentPage * this.itemsPerPage;
        const endIdx = startIdx + this.itemsPerPage;
        const pageData = this.allData.slice(startIdx, endIdx);

        console.log('📈 Rendering chart with', pageData.length, 'items');

        const canvas = document.getElementById('solutionModalChart');
        if (!canvas) {
            console.error('❌ Canvas not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        // Verificar que el contenedor tenga tamaño
        if (container.clientWidth === 0) {
            console.warn('⚠️ Container width is 0, retrying...');
            setTimeout(() => this.renderChart(), 100);
            return;
        }

        const containerWidth = container.clientWidth;
        const desiredHeight = 500;

        // ✅ SOLUCIÓN: NO usar DPR scaling, usar tamaños CSS directamente
        canvas.width = containerWidth;
        canvas.height = desiredHeight;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = desiredHeight + 'px';

        if (this.chart) {
            this.chart.destroy();
        }

        if (pageData.length === 0) {
            ctx.font = '16px Inter, sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', containerWidth / 2, desiredHeight / 2);
            return;
        }

        // ✅ DEGRADADO: Crear gradiente para las barras
        const gradient = ctx.createLinearGradient(0, 0, 0, desiredHeight);
        gradient.addColorStop(0, 'rgba(17, 212, 115, 0.8)');
        gradient.addColorStop(1, 'rgba(17, 212, 115, 0.3)');

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: pageData.map(item => item.name),
                datasets: [{
                    label: 'Revenue (USD)',
                    data: pageData.map(item => item.revenue),
                    backgroundColor: gradient, // ✅ Usar el gradiente
                    borderColor: 'rgba(17, 212, 115, 0.7)',
                    borderWidth: 0,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(17, 212, 115, 0.9)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio: 1, // ✅ Evitar scaling automático
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#1f2937',
                            font: { 
                                size: 14, 
                                weight: '600',
                                family: "'Inter', sans-serif"
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'rectRounded'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 16,
                        cornerRadius: 8,
                        displayColors: false,
                        bodyFont: {
                            size: 13,
                            family: "'Inter', sans-serif"
                        },
                        titleFont: {
                            size: 14,
                            weight: 'bold',
                            family: "'Inter', sans-serif"
                        },
                        callbacks: {
                            title: (context) => {
                                return pageData[context[0].dataIndex].name;
                            },
                            label: (context) => {
                                const item = pageData[context.dataIndex];
                                return [
                                    `Product Number: ${item.product_number}`,
                                    `Revenue: ${this.formatCurrency(item.revenue)}`,
                                    `Times Used: ${item.usage}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#6b7280',
                            font: { 
                                size: 12,
                                family: "'Inter', sans-serif"
                            },
                            maxRotation: 45,
                            minRotation: 45,
                            autoSkip: false
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#6b7280',
                            font: { 
                                size: 12,
                                family: "'Inter', sans-serif"
                            },
                            callback: (value) => this.formatCurrency(value)
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 10,
                        left: 10
                    }
                }
            }
        });

        this.updatePaginationButtons();
        console.log('✅ Chart rendered successfully');
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        } else {
            return `$${amount.toFixed(0)}`;
        }
    }

    updatePaginationButtons() {
        const totalPages = Math.ceil(this.allData.length / this.itemsPerPage);
        const pageInfo = document.getElementById('solutionPageInfo');
        const prevBtn = document.getElementById('solutionPrevPageBtn');
        const nextBtn = document.getElementById('solutionNextPageBtn');

        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage + 1} of ${totalPages} (${this.allData.length} total solutions)`;
        }
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 0;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages - 1;
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderChart();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.allData.length / this.itemsPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.renderChart();
        }
    }
}

// ✅ EXACTAMENTE IGUAL que approval_trends_modal.js
document.addEventListener('DOMContentLoaded', function() {
    window.solutionRevenueModal = new SolutionRevenueModal();
    console.log('✅ SolutionRevenueModal initialized');
});