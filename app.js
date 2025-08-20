// Sistema de Manutenção Preventiva - JavaScript
class MaintenanceSystem {
    constructor() {
        this.data = {
            machines: [
                {
                    id: "M001",
                    name: "Torno CNC 1",
                    ip: "192.168.1.100",
                    opcServer: "opc.tcp://192.168.1.100:4840",
                    status: "online",
                    description: "Torno CNC para peças de precisão",
                    uptime: 98.5,
                    variables: [
                        {
                            id: "V001",
                            name: "nivel_oleo",
                            description: "Nível do óleo",
                            nodeId: "ns=2;i=1",
                            unit: "%",
                            currentValue: 85,
                            alertThreshold: 80,
                            criticalThreshold: 70,
                            active: true
                        },
                        {
                            id: "V002", 
                            name: "temperatura_motor",
                            description: "Temperatura do motor",
                            nodeId: "ns=2;i=2",
                            unit: "°C",
                            currentValue: 75,
                            alertThreshold: 85,
                            criticalThreshold: 95,
                            active: true
                        },
                        {
                            id: "V003",
                            name: "vibracao",
                            description: "Nível de vibração",
                            nodeId: "ns=2;i=3", 
                            unit: "mm/s",
                            currentValue: 3.2,
                            alertThreshold: 4.5,
                            criticalThreshold: 6.0,
                            active: true
                        }
                    ]
                },
                {
                    id: "M002",
                    name: "Fresadora Universal",
                    ip: "192.168.1.101", 
                    opcServer: "opc.tcp://192.168.1.101:4840",
                    status: "warning",
                    description: "Fresadora para usinagem geral",
                    uptime: 94.2,
                    variables: [
                        {
                            id: "V004",
                            name: "pressao_hidraulica",
                            description: "Pressão hidráulica",
                            nodeId: "ns=2;i=4",
                            unit: "bar",
                            currentValue: 145,
                            alertThreshold: 150,
                            criticalThreshold: 120,
                            active: true
                        },
                        {
                            id: "V005",
                            name: "nivel_fluido_corte", 
                            description: "Nível fluido de corte",
                            nodeId: "ns=2;i=5",
                            unit: "%",
                            currentValue: 22,
                            alertThreshold: 25,
                            criticalThreshold: 15,
                            active: true
                        }
                    ]
                },
                {
                    id: "M003",
                    name: "Prensa Hidráulica",
                    ip: "192.168.1.102",
                    opcServer: "opc.tcp://192.168.1.102:4840", 
                    status: "offline",
                    description: "Prensa hidráulica 200 toneladas",
                    uptime: 87.1,
                    variables: [
                        {
                            id: "V006",
                            name: "pressao_sistema",
                            description: "Pressão do sistema",
                            nodeId: "ns=2;i=6",
                            unit: "bar",
                            currentValue: 0,
                            alertThreshold: 180,
                            criticalThreshold: 160,
                            active: true
                        }
                    ]
                }
            ],
            technicians: [
                {
                    id: "T001",
                    name: "João Silva", 
                    whatsapp: "+5554999123456",
                    specialty: "Mecânica Geral",
                    status: "available",
                    responsibleMachines: ["M001", "M002"]
                },
                {
                    id: "T002",
                    name: "Maria Santos",
                    whatsapp: "+5554999234567", 
                    specialty: "Sistemas Hidráulicos",
                    status: "busy",
                    responsibleMachines: ["M002", "M003"]
                },
                {
                    id: "T003",
                    name: "Carlos Oliveira",
                    whatsapp: "+5554999345678",
                    specialty: "Eletrônica Industrial", 
                    status: "available",
                    responsibleMachines: ["M001", "M003"]
                }
            ],
            alerts: [
                {
                    id: "A001",
                    machineId: "M002",
                    machineName: "Fresadora Universal",
                    variableId: "V005",
                    variableName: "Nível fluido de corte",
                    level: "warning",
                    currentValue: 22,
                    threshold: 25,
                    unit: "%",
                    timestamp: "2025-08-20T12:30:00",
                    status: "pending",
                    technicianId: "T002"
                },
                {
                    id: "A002", 
                    machineId: "M003",
                    machineName: "Prensa Hidráulica",
                    variableId: "V006",
                    variableName: "Pressão do sistema",
                    level: "critical",
                    currentValue: 0,
                    threshold: 160,
                    unit: "bar",
                    timestamp: "2025-08-20T11:45:00",
                    status: "in_progress",
                    technicianId: "T002"
                },
                {
                    id: "A003",
                    machineId: "M001", 
                    machineName: "Torno CNC 1",
                    variableId: "V001",
                    variableName: "Nível do óleo",
                    level: "warning",
                    currentValue: 78,
                    threshold: 80,
                    unit: "%",
                    timestamp: "2025-08-20T10:15:00",
                    status: "resolved",
                    technicianId: "T001"
                }
            ]
        };

        this.selectedMachine = null;
        this.chart = null;
        this.realTimeInterval = null;
        this.currentSection = 'dashboard';
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAll());
        } else {
            this.setupAll();
        }
    }

    setupAll() {
        this.setupNavigation();
        this.setupModals();
        this.setupEventListeners();
        this.updateCurrentTime();
        this.startRealTimeUpdates();
        this.renderDashboard();
        this.renderMachines();
        this.renderTechnicians();
        this.renderAlertsTable();
        this.populateMachineSelect();
        
        // Start with dashboard active
        this.showSection('dashboard');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show section
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Special handling for specific sections
            if (sectionName === 'variables') {
                this.renderVariables();
            } else if (sectionName === 'alerts') {
                this.renderAlertsTable();
            }
        }
    }

    setupModals() {
        // Modal close functionality
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = button.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close modal on backdrop click
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Cancel buttons
        const cancelButtons = document.querySelectorAll('[data-modal]');
        cancelButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = button.dataset.modal;
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });
    }

    setupEventListeners() {
        // Add machine button
        const addMachineBtn = document.getElementById('addMachineBtn');
        if (addMachineBtn) {
            addMachineBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('addMachineModal');
            });
        }

        // Add technician button
        const addTechnicianBtn = document.getElementById('addTechnicianBtn');
        if (addTechnicianBtn) {
            addTechnicianBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openModal('addTechnicianModal');
            });
        }

        // Save buttons
        const saveMachineBtn = document.getElementById('saveMachineBtn');
        if (saveMachineBtn) {
            saveMachineBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveMachine();
            });
        }

        const saveTechnicianBtn = document.getElementById('saveTechnicianBtn');
        if (saveTechnicianBtn) {
            saveTechnicianBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveTechnician();
            });
        }

        const saveVariableBtn = document.getElementById('saveVariableBtn');
        if (saveVariableBtn) {
            saveVariableBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveVariable();
            });
        }

        // Machine select change
        const machineSelect = document.getElementById('machineSelect');
        if (machineSelect) {
            machineSelect.addEventListener('change', (e) => {
                this.selectedMachine = e.target.value;
                this.renderVariables();
            });
        }

        // Alert filters
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.renderAlertsTable();
            });
        }

        const levelFilter = document.getElementById('levelFilter');
        if (levelFilter) {
            levelFilter.addEventListener('change', () => {
                this.renderAlertsTable();
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            // Reset forms
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('pt-BR');
        }
        
        // Update every minute
        setTimeout(() => this.updateCurrentTime(), 60000);
    }

    startRealTimeUpdates() {
        this.realTimeInterval = setInterval(() => {
            this.simulateRealTimeData();
            this.checkForAlerts();
            
            // Only update current section to avoid performance issues
            if (this.currentSection === 'dashboard') {
                this.renderDashboard();
            } else if (this.currentSection === 'variables') {
                this.renderVariables();
            }
        }, 5000); // Update every 5 seconds
    }

    simulateRealTimeData() {
        this.data.machines.forEach(machine => {
            machine.variables.forEach(variable => {
                if (!variable.active || machine.status === 'offline') {
                    if (machine.status === 'offline') {
                        variable.currentValue = 0;
                    }
                    return;
                }

                // Simulate value changes
                const variation = (Math.random() - 0.5) * 2; // -1 to 1
                let newValue = variable.currentValue + variation;
                
                // Keep values in reasonable ranges
                if (variable.unit === '%') {
                    newValue = Math.max(0, Math.min(100, newValue));
                } else if (variable.name.includes('temperatura')) {
                    newValue = Math.max(20, Math.min(120, newValue));
                } else {
                    newValue = Math.max(0, newValue);
                }
                
                variable.currentValue = Math.round(newValue * 10) / 10;
            });
        });
    }

    checkForAlerts() {
        this.data.machines.forEach(machine => {
            machine.variables.forEach(variable => {
                if (!variable.active) return;

                let alertLevel = null;
                let threshold = null;

                if (variable.currentValue <= variable.criticalThreshold || 
                    (variable.name.includes('pressao') && variable.currentValue >= variable.alertThreshold)) {
                    alertLevel = 'critical';
                    threshold = variable.criticalThreshold;
                } else if (variable.currentValue <= variable.alertThreshold ||
                          (variable.name.includes('pressao') && variable.currentValue >= variable.alertThreshold)) {
                    alertLevel = 'warning';
                    threshold = variable.alertThreshold;
                }

                if (alertLevel) {
                    // Check if alert already exists
                    const existingAlert = this.data.alerts.find(alert => 
                        alert.machineId === machine.id && 
                        alert.variableId === variable.id && 
                        alert.status === 'pending'
                    );

                    if (!existingAlert) {
                        this.createAlert(machine, variable, alertLevel, threshold);
                    }
                }
            });
        });
    }

    createAlert(machine, variable, level, threshold) {
        const newAlert = {
            id: 'A' + String(this.data.alerts.length + 1).padStart(3, '0'),
            machineId: machine.id,
            machineName: machine.name,
            variableId: variable.id,
            variableName: variable.description,
            level: level,
            currentValue: variable.currentValue,
            threshold: threshold,
            unit: variable.unit,
            timestamp: new Date().toISOString(),
            status: 'pending',
            technicianId: this.getResponsibleTechnician(machine.id)
        };

        this.data.alerts.unshift(newAlert);
        
        // Update machine status
        if (level === 'critical') {
            machine.status = 'offline';
        } else if (level === 'warning' && machine.status === 'online') {
            machine.status = 'warning';
        }
    }

    getResponsibleTechnician(machineId) {
        const technician = this.data.technicians.find(tech => 
            tech.responsibleMachines.includes(machineId) && tech.status === 'available'
        );
        return technician ? technician.id : this.data.technicians[0].id;
    }

    renderDashboard() {
        // Update stats
        const online = this.data.machines.filter(m => m.status === 'online').length;
        const warning = this.data.machines.filter(m => m.status === 'warning').length;
        const offline = this.data.machines.filter(m => m.status === 'offline').length;
        const avgUptime = (this.data.machines.reduce((sum, m) => sum + m.uptime, 0) / this.data.machines.length).toFixed(1);

        const onlineEl = document.getElementById('onlineMachines');
        const warningEl = document.getElementById('warningMachines');
        const offlineEl = document.getElementById('offlineMachines');
        const uptimeEl = document.getElementById('avgUptime');

        if (onlineEl) onlineEl.textContent = online;
        if (warningEl) warningEl.textContent = warning;
        if (offlineEl) offlineEl.textContent = offline;
        if (uptimeEl) uptimeEl.textContent = avgUptime + '%';

        // Update real-time alerts
        this.renderRealtimeAlerts();
        
        // Update chart
        this.renderTrendsChart();
    }

    renderRealtimeAlerts() {
        const alertsContainer = document.getElementById('realtimeAlerts');
        if (!alertsContainer) return;

        const pendingAlerts = this.data.alerts.filter(alert => alert.status === 'pending').slice(0, 5);
        
        if (pendingAlerts.length === 0) {
            alertsContainer.innerHTML = '<p class="no-selection">Nenhum alerta ativo</p>';
            return;
        }

        alertsContainer.innerHTML = pendingAlerts.map(alert => `
            <div class="alert-item ${alert.level}">
                <div class="alert-content">
                    <div class="alert-machine">${alert.machineName}</div>
                    <div class="alert-variable">${alert.variableName}</div>
                </div>
                <div class="alert-value">
                    ${alert.currentValue} ${alert.unit}
                </div>
            </div>
        `).join('');
    }

    renderTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Generate sample trend data
        const labels = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }

        const datasets = this.data.machines.slice(0, 3).map((machine, index) => {
            const colors = ['#1FB8CD', '#FFC185', '#B4413C'];
            return {
                label: machine.name,
                data: Array.from({ length: 7 }, () => Math.random() * 100),
                borderColor: colors[index],
                backgroundColor: colors[index] + '20',
                tension: 0.4
            };
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    renderMachines() {
        const machinesContainer = document.getElementById('machinesList');
        if (!machinesContainer) return;
        
        machinesContainer.innerHTML = this.data.machines.map(machine => `
            <div class="machine-card">
                <div class="machine-header">
                    <div>
                        <h3 class="machine-name">${machine.name}</h3>
                        <p class="machine-ip">${machine.ip}</p>
                    </div>
                    <span class="machine-status ${machine.status}">
                        ${machine.status === 'online' ? 'Online' : 
                          machine.status === 'warning' ? 'Alerta' : 'Offline'}
                    </span>
                </div>
                <p class="machine-description">${machine.description}</p>
                <div class="machine-uptime">
                    <span class="uptime-label">Uptime:</span>
                    <span class="uptime-value">${machine.uptime}%</span>
                </div>
                <div class="machine-actions">
                    <button class="btn btn--sm btn--outline" onclick="window.system.testConnection('${machine.id}')">
                        Testar Conexão
                    </button>
                    <button class="btn btn--sm btn--primary" onclick="window.system.viewMachineDetails('${machine.id}')">
                        Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderTechnicians() {
        const techniciansContainer = document.getElementById('techniciansList');
        if (!techniciansContainer) return;
        
        techniciansContainer.innerHTML = this.data.technicians.map(technician => {
            const responsibleMachineNames = technician.responsibleMachines.map(machineId => {
                const machine = this.data.machines.find(m => m.id === machineId);
                return machine ? machine.name : '';
            }).filter(name => name);

            return `
                <div class="technician-card">
                    <div class="technician-header">
                        <div class="technician-info">
                            <h4>${technician.name}</h4>
                            <p class="technician-specialty">${technician.specialty}</p>
                            <p class="technician-whatsapp">${technician.whatsapp}</p>
                        </div>
                        <span class="technician-status ${technician.status}">
                            ${technician.status === 'available' ? 'Disponível' : 
                              technician.status === 'busy' ? 'Ocupado' : 'Ausente'}
                        </span>
                    </div>
                    <div class="technician-machines">
                        <div class="machines-label">Máquinas Responsáveis:</div>
                        <div class="machine-tags">
                            ${responsibleMachineNames.map(name => `
                                <span class="machine-tag">${name}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    populateMachineSelect() {
        const select = document.getElementById('machineSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione uma máquina</option>' +
            this.data.machines.map(machine => 
                `<option value="${machine.id}">${machine.name}</option>`
            ).join('');
    }

    renderVariables() {
        const variablesContainer = document.getElementById('variablesList');
        if (!variablesContainer) return;
        
        if (!this.selectedMachine) {
            variablesContainer.innerHTML = '<p class="no-selection">Selecione uma máquina para ver suas variáveis</p>';
            return;
        }

        const machine = this.data.machines.find(m => m.id === this.selectedMachine);
        if (!machine) return;

        // Add variable button (create if doesn't exist)
        let addButton = document.querySelector('.add-variable-btn');
        if (!addButton && this.currentSection === 'variables') {
            addButton = document.createElement('button');
            addButton.className = 'add-variable-btn';
            addButton.innerHTML = '+';
            addButton.addEventListener('click', () => this.openModal('addVariableModal'));
            document.body.appendChild(addButton);
        }

        variablesContainer.innerHTML = machine.variables.map(variable => `
            <div class="variable-card">
                <div class="variable-header">
                    <div class="variable-info">
                        <h4>${variable.description}</h4>
                        <p class="variable-description">Node ID: ${variable.nodeId}</p>
                    </div>
                    <div class="variable-toggle">
                        <span>Ativo</span>
                        <div class="toggle-switch ${variable.active ? 'active' : ''}" 
                             onclick="window.system.toggleVariable('${machine.id}', '${variable.id}')">
                        </div>
                    </div>
                </div>
                <div class="variable-values">
                    <div class="value-item">
                        <div class="value-label">Valor Atual</div>
                        <div class="value-number">
                            ${variable.currentValue}
                            <span class="value-unit">${variable.unit}</span>
                        </div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Limite Alerta</div>
                        <div class="value-number">
                            ${variable.alertThreshold}
                            <span class="value-unit">${variable.unit}</span>
                        </div>
                    </div>
                    <div class="value-item">
                        <div class="value-label">Limite Crítico</div>
                        <div class="value-number">
                            ${variable.criticalThreshold}
                            <span class="value-unit">${variable.unit}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAlertsTable() {
        const alertsContainer = document.getElementById('alertsTable');
        if (!alertsContainer) return;

        const statusFilterEl = document.getElementById('statusFilter');
        const levelFilterEl = document.getElementById('levelFilter');
        
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';
        const levelFilter = levelFilterEl ? levelFilterEl.value : '';

        let filteredAlerts = this.data.alerts;

        if (statusFilter) {
            filteredAlerts = filteredAlerts.filter(alert => alert.status === statusFilter);
        }

        if (levelFilter) {
            filteredAlerts = filteredAlerts.filter(alert => alert.level === levelFilter);
        }

        alertsContainer.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Máquina</th>
                        <th>Variável</th>
                        <th>Nível</th>
                        <th>Valor</th>
                        <th>Limite</th>
                        <th>Data/Hora</th>
                        <th>Status</th>
                        <th>Técnico</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredAlerts.map(alert => {
                        const technician = this.data.technicians.find(t => t.id === alert.technicianId);
                        const alertTime = new Date(alert.timestamp);
                        
                        return `
                            <tr>
                                <td>${alert.machineName}</td>
                                <td>${alert.variableName}</td>
                                <td><span class="alert-level ${alert.level}">${alert.level === 'warning' ? 'Alerta' : 'Crítico'}</span></td>
                                <td>${alert.currentValue} ${alert.unit}</td>
                                <td>${alert.threshold} ${alert.unit}</td>
                                <td>${alertTime.toLocaleString('pt-BR')}</td>
                                <td><span class="alert-status ${alert.status}">
                                    ${alert.status === 'pending' ? 'Pendente' : 
                                      alert.status === 'in_progress' ? 'Em Atendimento' : 'Resolvido'}
                                </span></td>
                                <td>${technician ? technician.name : 'N/A'}</td>
                                <td>
                                    <button class="btn btn--sm btn--outline" onclick="window.system.sendWhatsApp('${alert.id}')">
                                        WhatsApp
                                    </button>
                                    ${alert.status !== 'resolved' ? 
                                        `<button class="btn btn--sm btn--primary" onclick="window.system.resolveAlert('${alert.id}')">
                                            Resolver
                                        </button>` : ''
                                    }
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    // Event handlers
    testConnection(machineId) {
        const machine = this.data.machines.find(m => m.id === machineId);
        if (machine) {
            // Simulate connection test
            const success = Math.random() > 0.3;
            const message = success ? 
                `Conexão com ${machine.name} estabelecida com sucesso!` :
                `Falha na conexão com ${machine.name}. Verifique a rede.`;
            
            alert(message);
        }
    }

    viewMachineDetails(machineId) {
        // Switch to variables section and select machine
        this.selectedMachine = machineId;
        const machineSelect = document.getElementById('machineSelect');
        if (machineSelect) {
            machineSelect.value = machineId;
        }
        
        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === 'variables') {
                link.classList.add('active');
            }
        });
        
        this.showSection('variables');
    }

    toggleVariable(machineId, variableId) {
        const machine = this.data.machines.find(m => m.id === machineId);
        if (machine) {
            const variable = machine.variables.find(v => v.id === variableId);
            if (variable) {
                variable.active = !variable.active;
                this.renderVariables();
            }
        }
    }

    sendWhatsApp(alertId) {
        const alert = this.data.alerts.find(a => a.id === alertId);
        const technician = this.data.technicians.find(t => t.id === alert.technicianId);
        
        if (alert && technician) {
            const template = alert.level === 'critical' ? 'critical' : 'warning';
            const message = this.formatWhatsAppMessage(alert, template);
            
            // Simulate WhatsApp sending
            const whatsappUrl = `https://wa.me/${technician.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
            alert('Mensagem WhatsApp enviada para ' + technician.name);
        }
    }

    formatWhatsAppMessage(alert, template) {
        const timestamp = new Date(alert.timestamp).toLocaleString('pt-BR');
        const templates = {
            warning: `⚠️ ALERTA: ${alert.machineName}\n📊 Variável: ${alert.variableName}\n📈 Valor atual: ${alert.currentValue} ${alert.unit}\n🔔 Limite: ${alert.threshold} ${alert.unit}\n⏰ Horário: ${timestamp}`,
            critical: `🚨 CRÍTICO: ${alert.machineName}\n📊 Variável: ${alert.variableName}\n📈 Valor atual: ${alert.currentValue} ${alert.unit}\n🔴 Limite crítico: ${alert.threshold} ${alert.unit}\n⏰ Horário: ${timestamp}\n🔧 Ação necessária imediatamente!`
        };
        
        return templates[template] || templates.warning;
    }

    resolveAlert(alertId) {
        const alert = this.data.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'resolved';
            this.renderAlertsTable();
            this.renderDashboard();
            alert('Alerta marcado como resolvido!');
        }
    }

    // Form handlers
    saveMachine() {
        const form = document.getElementById('addMachineForm');
        if (!form) return;

        const formData = new FormData(form);
        
        const newMachine = {
            id: 'M' + String(this.data.machines.length + 1).padStart(3, '0'),
            name: formData.get('name'),
            ip: formData.get('ip'),
            opcServer: formData.get('opcServer'),
            description: formData.get('description'),
            status: 'offline',
            uptime: 0,
            variables: []
        };

        this.data.machines.push(newMachine);
        this.renderMachines();
        this.populateMachineSelect();
        this.closeModal('addMachineModal');
        
        alert('Máquina adicionada com sucesso!');
    }

    saveTechnician() {
        const form = document.getElementById('addTechnicianForm');
        if (!form) return;

        const formData = new FormData(form);
        
        const newTechnician = {
            id: 'T' + String(this.data.technicians.length + 1).padStart(3, '0'),
            name: formData.get('name'),
            whatsapp: formData.get('whatsapp'),
            specialty: formData.get('specialty'),
            status: 'available',
            responsibleMachines: []
        };

        this.data.technicians.push(newTechnician);
        this.renderTechnicians();
        this.closeModal('addTechnicianModal');
        
        alert('Técnico adicionado com sucesso!');
    }

    saveVariable() {
        if (!this.selectedMachine) {
            alert('Selecione uma máquina primeiro!');
            return;
        }

        const form = document.getElementById('addVariableForm');
        if (!form) return;

        const formData = new FormData(form);
        const machine = this.data.machines.find(m => m.id === this.selectedMachine);
        
        if (machine) {
            const newVariable = {
                id: 'V' + String(Date.now()).slice(-3),
                name: formData.get('name'),
                description: formData.get('description'),
                nodeId: formData.get('nodeId'),
                unit: formData.get('unit'),
                currentValue: 0,
                alertThreshold: parseFloat(formData.get('alertThreshold')),
                criticalThreshold: parseFloat(formData.get('criticalThreshold')),
                active: true
            };

            machine.variables.push(newVariable);
            this.renderVariables();
            this.closeModal('addVariableModal');
            
            alert('Variável adicionada com sucesso!');
        }
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.system = new MaintenanceSystem();
});