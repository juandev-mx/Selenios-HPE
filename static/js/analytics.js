
class AnalyticsDashboard {
    constructor() {
        this.baseUrl = '/api/analytics';
        this.init();
    }

    init() {
        this.loadKPIs();
        this.loadSolutionsPerformance();
        this.loadClientsPerformance();
        this.loadTeamPerformance();
        this.loadApprovalTrends();
    }

    async loadKPIs() {
        try {
            const response = await fetch(`${this.baseUrl}/kpi`);
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

                        document.querySelector('.kpi-card:nth-child(1) .kpi-value').textContent = 
                this.formatCurrency(data.total_revenue);
            document.querySelector('.kpi-card:nth-child(2) .kpi-value').textContent = 
                `${data.approval_rate}%`;
            document.querySelector('.kpi-card:nth-child(3) .kpi-value').textContent = 
                data.active_clients;

        } catch (error) {
            console.error('Error loading KPIs:', error);
        }
    }

    async loadSolutionsPerformance() {
        try {
            const response = await fetch(`${this.baseUrl}/solutions-performance`);
            const solutions = await response.json();
            
            if (solutions.error) throw new Error(solutions.error);

            this.updateSolutionsChart(solutions);
            this.updateSolutionsRevenue(solutions);

        } catch (error) {
            console.error('Error loading solutions performance:', error);
        }
    }

    updateSolutionsChart(solutions) {
        const chartBars = document.querySelector('.chart-bars');
        chartBars.innerHTML = '';

        const maxRevenue = Math.max(...solutions.map(s => s.revenue));
        
        solutions.forEach(solution => {
            const barHeight = (solution.revenue / maxRevenue) * 100;
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.innerHTML = `
                <div class="bar" style="height: ${barHeight}px;"></div>
                <div class="bar-label">${this.truncateText(solution.name, 15)}</div>
            `;
            chartBars.appendChild(bar);
        });
    }

    updateSolutionsRevenue(solutions) {
        const totalRevenue = solutions.reduce((sum, sol) => sum + sol.revenue, 0);
        const chartValue = document.querySelector('.chart-grid .chart-box:nth-child(1) .chart-value');
        chartValue.textContent = this.formatCurrency(totalRevenue);
    }

    async loadClientsPerformance() {
        try {
            const response = await fetch(`${this.baseUrl}/clients-performance`);
            const clients = await response.json();
            
            if (clients.error) throw new Error(clients.error);

            this.updateClientsTable(clients);

        } catch (error) {
            console.error('Error loading clients performance:', error);
        }
    }

    updateClientsTable(clients) {
        const tbody = document.querySelector('.section-card:nth-child(2) tbody');
        tbody.innerHTML = '';

        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="client-name">${client.name}</td>
                <td class="client-revenue">${this.formatCurrency(client.revenue)}</td>
                <td>
                    <span class="status-badge ${client.status === 'Active' ? 'status-active' : 'status-inactive'}">
                        ${client.status}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadTeamPerformance() {
        try {
            const response = await fetch(`${this.baseUrl}/team-performance`);
            const team = await response.json();
            
            if (team.error) throw new Error(team.error);

            this.updateTeamTable(team);

        } catch (error) {
            console.error('Error loading team performance:', error);
        }
    }

    updateTeamTable(team) {
        const tbody = document.querySelector('.full-width tbody');
        tbody.innerHTML = '';

        team.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="rep-name">${member.rep_name}</td>
                <td class="manager-name">${member.manager_name}</td>
                <td class="revenue">${this.formatCurrency(member.revenue)}</td>
                <td class="approvals">${member.equipment_used}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadApprovalTrends() {
        try {
            const response = await fetch(`${this.baseUrl}/approval-trends`);
            const trends = await response.json();
            
            if (trends.error) throw new Error(trends.error);

            this.updateApprovalTrends(trends);

        } catch (error) {
            console.error('Error loading approval trends:', error);
        }
    }

    updateApprovalTrends(trends) {
        const currentQuarterRate = trends.length > 0 ? trends[trends.length - 1].approval_rate : 0;
        const previousQuarterRate = trends.length > 1 ? trends[trends.length - 2].approval_rate : 0;
        
        const change = currentQuarterRate - previousQuarterRate;
        const changeElement = document.querySelector('.chart-grid .chart-box:nth-child(2) .kpi-change');
        
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        changeElement.className = `kpi-change ${change >= 0 ? 'positive' : 'negative'}`;

        const chartValue = document.querySelector('.chart-grid .chart-box:nth-child(2) .chart-value');
        chartValue.textContent = `${currentQuarterRate}%`;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});