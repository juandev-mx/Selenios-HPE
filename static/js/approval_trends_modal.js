class ApprovalTrendsModal {
    constructor() {
        this.currentPage = 0;
        this.itemsPerPage = 50;
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
                if (this.chart && document.getElementById('approvalTrendsModal').classList.contains('active')) {
                    this.renderChart();
                }
            }, 250);
        });
    }

    createModalHTML() {
        const modalHTML = `
            <div id="approvalTrendsModal" class="approval-modal">
                <div class="approval-modal-content">
                    <div class="approval-modal-header">
                        <h2>Approval Trends - Complete View</h2>
                        <button class="approval-modal-close">&times;</button>
                    </div>
                    <div class="approval-modal-body">
                        <canvas id="approvalModalChart"></canvas>
                        <div class="approval-pagination">
                            <button id="prevPageBtn" class="pagination-btn" disabled>
                                ← Previous
                            </button>
                            <span id="pageInfo" class="page-info">Page 1</span>
                            <button id="nextPageBtn" class="pagination-btn">
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (!document.getElementById('approvalTrendsModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    attachEventListeners() {
        const modal = document.getElementById('approvalTrendsModal');
        const closeBtn = modal.querySelector('.approval-modal-close');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

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
            console.log('🔄 Opening modal...');
            const data = await this.fetchAllApprovalData();
            console.log('📊 Data fetched:', data.length, 'items');
            
            this.allData = data;
            this.currentPage = 0;
            
            const modal = document.getElementById('approvalTrendsModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // ✅ IMPORTANTE: Renderizar después de que el modal sea visible
            setTimeout(() => {
                this.renderChart();
            }, 100);
            
        } catch (error) {
            console.error('❌ Error opening modal:', error);
            notify.error('Could not load approval data', { title: 'Error' });
        }
    }

    close() {
        const modal = document.getElementById('approvalTrendsModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    async fetchAllApprovalData() {
        const [pocsResponse, pocEquipmentResponse, equipmentResponse] = await Promise.all([
            fetch('/pocs'),
            fetch('/poc_equipment'),
            fetch('/equipment')
        ]);

        const pocs = await pocsResponse.json();
        const pocEquipment = await pocEquipmentResponse.json();
        const equipment = await equipmentResponse.json();

        const equipmentMap = {};
        equipment.forEach(eq => {
            equipmentMap[eq.solution_id] = {
                name: eq.product_description || eq.product_number || 'N/A',
                product_number: eq.product_number || 'N/A'
            };
        });

        const statsByEquipment = {};

        pocEquipment.forEach(pe => {
            const poc = pocs.find(p => p.poc_id === pe.poc_id);
            if (!poc) return;

            const equipmentId = pe.solution_id;
            if (!statsByEquipment[equipmentId]) {
                statsByEquipment[equipmentId] = { total: 0, approved: 0 };
            }

            statsByEquipment[equipmentId].total++;
            if (poc.is_approved) statsByEquipment[equipmentId].approved++;
        });

        const data = Object.keys(statsByEquipment)
            .filter(eqId => statsByEquipment[eqId].total > 0)
            .map(eqId => {
                const stats = statsByEquipment[eqId];
                const rate = (stats.approved / stats.total) * 100;
                const equipmentInfo = equipmentMap[eqId] || { 
                    name: 'N/A', 
                    product_number: 'N/A'
                };
                
                return {
                    equipment: equipmentInfo.name,
                    product_number: equipmentInfo.product_number,
                    approvalRate: rate,
                    approved: stats.approved,
                    total: stats.total
                };
            });

        // Ordenar alfabéticamente
        data.sort((a, b) => a.equipment.localeCompare(b.equipment));

        return data;
    }

    renderChart() {
        const startIdx = this.currentPage * this.itemsPerPage;
        const endIdx = startIdx + this.itemsPerPage;
        const pageData = this.allData.slice(startIdx, endIdx);

        console.log('📈 Rendering chart with', pageData.length, 'items');

        const canvas = document.getElementById('approvalModalChart');
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

        // Configurar el canvas con alta resolución para evitar pixelado
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerWidth * dpr;
        canvas.height = desiredHeight * dpr;
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = desiredHeight + 'px';
        ctx.scale(dpr, dpr);

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

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: pageData.map(item => item.equipment),
                datasets: [{
                    label: 'Approval Rate (%)',
                    data: pageData.map(item => item.approvalRate),
                    borderColor: '#01a982',
                    backgroundColor: 'rgba(1, 169, 130, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#01a982',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#00875a',
                    pointHoverBorderColor: '#fff',
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
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
                            pointStyle: 'circle'
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
                                return pageData[context[0].dataIndex].equipment;
                            },
                            label: (context) => {
                                const item = pageData[context.dataIndex];
                                return [
                                    `Product Number: ${item.product_number}`,
                                    `Rate: ${item.approvalRate.toFixed(1)}%`,
                                    `Approved: ${item.approved}/${item.total}`
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
                        max: 110,
                        ticks: {
                            color: '#6b7280',
                            font: { 
                                size: 12,
                                family: "'Inter', sans-serif"
                            },
                            callback: (value) => value <= 100 ? `${value}%` : '',
                            stepSize: 20
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

    updatePaginationButtons() {
        const totalPages = Math.ceil(this.allData.length / this.itemsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage + 1} of ${totalPages} (${this.allData.length} total equipments)`;
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

document.addEventListener('DOMContentLoaded', function() {
    window.approvalTrendsModal = new ApprovalTrendsModal();
    console.log('✅ ApprovalTrendsModal initialized');
});