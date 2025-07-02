// Dados de países e suas distâncias aproximadas do Brasil (em km)
const countries = {
    'china': { name: 'China', distance: 17000, factor: 1.2 },
    'usa': { name: 'Estados Unidos', distance: 7500, factor: 1.0 },
    'germany': { name: 'Alemanha', distance: 9500, factor: 1.1 },
    'japan': { name: 'Japão', distance: 18500, factor: 1.3 },
    'south_korea': { name: 'Coreia do Sul', distance: 18000, factor: 1.25 },
    'italy': { name: 'Itália', distance: 9000, factor: 1.05 },
    'france': { name: 'França', distance: 8500, factor: 1.0 },
    'uk': { name: 'Reino Unido', distance: 9200, factor: 1.1 },
    'spain': { name: 'Espanha', distance: 8000, factor: 0.95 },
    'netherlands': { name: 'Holanda', distance: 9300, factor: 1.1 },
    'india': { name: 'Índia', distance: 15000, factor: 1.15 },
    'mexico': { name: 'México', distance: 6500, factor: 0.9 },
    'canada': { name: 'Canadá', distance: 8000, factor: 1.0 },
    'argentina': { name: 'Argentina', distance: 2000, factor: 0.7 },
    'chile': { name: 'Chile', distance: 3500, factor: 0.8 }
};

// Dados de modalidades de transporte
const modalities = {
    'aereo': {
        name: 'Aéreo',
        baseCost: 8.5, // USD por kg
        speedFactor: 1.0,
        transitDays: { min: 3, max: 7 },
        co2Factor: 0.5, // kg CO2 por kg de carga
        icon: 'fas fa-plane'
    },
    'maritimo': {
        name: 'Marítimo',
        baseCost: 1.2, // USD por kg
        speedFactor: 0.1,
        transitDays: { min: 20, max: 45 },
        co2Factor: 0.01, // kg CO2 por kg de carga
        icon: 'fas fa-ship'
    }
};

let currentChart = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('freteForm');
    const resetBtn = document.getElementById('resetBtn');
    const modalitySelect = document.getElementById('modality');

    form.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    modalitySelect.addEventListener('change', handleModalityChange);
});

// Manipular mudança de modalidade
function handleModalityChange(e) {
    const modality = e.target.value;
    const aereoFields = document.getElementById('aereoFields');
    
    if (modality === 'aereo') {
        aereoFields.style.display = 'block';
        aereoFields.classList.add('show');
    } else {
        aereoFields.style.display = 'none';
        aereoFields.classList.remove('show');
    }
}

// Manipular envio do formulário
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const country = formData.get('country');
    const modality = formData.get('modality');
    
    if (!country || !modality) {
        alert('Por favor, selecione o país e a modalidade de transporte.');
        return;
    }

    // Para modalidade aérea, verificar se NCM está preenchido
    if (modality === 'aereo') {
        const ncm = formData.get('ncm');
        
        if (!ncm) {
            alert('Para modalidade aérea, preencha o NCM do produto.');
            return;
        }
    }

    showLoading();
    
    // Simular delay de processamento (3.5 segundos)
    setTimeout(() => {
        const result = calculateFreight(country, modality, formData);
        displayResult(result);
        hideLoading();
    }, 3500);
}

// Calcular frete
function calculateFreight(countryCode, modalityCode, formData) {
    const country = countries[countryCode];
    const modality = modalities[modalityCode];
    
    // Obter peso do formulário (pode ser vazio)
    const weightInput = formData.get('weight');
    const weight = weightInput ? parseFloat(weightInput) : null;
    
    const ncm = modalityCode === 'aereo' ? formData.get('ncm') : null;
    
    // Cálculo baseado na modalidade
    let baseCost, totalCost, costPerKg;
    
    if (modalityCode === 'aereo') {
        // Para aéreo: calcular baseado no peso (se fornecido) ou apenas preço por kg
        costPerKg = modality.baseCost * country.factor;
        
        if (weight) {
            baseCost = costPerKg * weight;
            const taxes = baseCost * 0.15;
            const handling = 75;
            const insurance = baseCost * 0.02;
            totalCost = baseCost + taxes + handling + insurance;
        } else {
            totalCost = null; // Apenas preço por kg será exibido
        }
    } else {
        // Para marítimo: custo fixo para container de 20-22 toneladas
        const containerWeight = 21000; // 21 toneladas (média entre 20-22)
        baseCost = modality.baseCost * (country.distance / 10000) * country.factor;
        const taxes = baseCost * 0.15;
        const handling = 200; // Taxa maior para container
        const insurance = baseCost * 0.02;
        totalCost = baseCost + taxes + handling + insurance;
        costPerKg = totalCost / containerWeight;
    }
    
    // Calcular tempo de trânsito
    const distanceFactor = country.distance / 10000;
    const minDays = Math.ceil(modality.transitDays.min * distanceFactor);
    const maxDays = Math.ceil(modality.transitDays.max * distanceFactor);
    
    // Calcular emissão de CO2 (baseado no peso usado no cálculo)
    const calculationWeight = modalityCode === 'maritimo' ? 21000 : (weight || 1);
    const co2Emission = calculationWeight * modality.co2Factor * (country.distance / 1000);
    
    return {
        country: country.name,
        modality: modality.name,
        modalityCode: modalityCode,
        weight: weight,
        containerWeight: modalityCode === 'maritimo' ? 21000 : null,
        ncm: ncm,
        baseCost: baseCost,
        totalCost: totalCost,
        transitDays: { min: minDays, max: maxDays },
        co2Emission: co2Emission,
        costPerKg: costPerKg
    };
}

// Exibir resultado
function displayResult(result) {
    const resultContent = document.getElementById('resultContent');
    
    // Construir HTML do resultado baseado na modalidade
    let resultHTML = `
        <div class="border-l-4 border-gray-500 pl-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-800">
                ${result.country} → Brasil
            </h3>
            <p class="text-gray-600">Modalidade: ${result.modality}</p>
            ${result.ncm ? `<p class="text-gray-600">NCM: ${result.ncm}</p>` : ''}
        </div>
    `;
    
    // Exibição específica por modalidade
    if (result.modalityCode === 'aereo') {
        // Para aéreo: verificar se tem peso ou apenas preço por kg
        if (result.weight) {
            // Com peso: mostrar peso + frete por kilo + valor total
            resultHTML += `
                <div class="grid grid-cols-1 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600">Peso Estimado</p>
                        <p class="text-xl font-bold text-gray-800">${result.weight.toFixed(1)} kg</p>
                    </div>
                </div>
                
                <div class="space-y-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Frete por kilo:</p>
                        <p class="text-xl font-bold text-gray-800">USD ${result.costPerKg.toFixed(2)}/kg</p>
                    </div>
                    <div class="bg-gray-100 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Valor do Frete Estimado:</p>
                        <p class="text-2xl font-bold text-gray-900">USD ${result.totalCost.toFixed(2)}</p>
                        <p class="text-sm text-gray-500">(R$ ${(result.totalCost * 5.2).toFixed(2)} - Cotação aproximada)</p>
                    </div>
                </div>
            `;
        } else {
            // Sem peso: mostrar apenas preço por kg
            resultHTML += `
                <div class="bg-gray-100 p-4 rounded-lg mb-6">
                    <p class="text-sm text-gray-600 mb-1">Frete por kilo:</p>
                    <p class="text-2xl font-bold text-gray-900">USD ${result.costPerKg.toFixed(2)}/kg</p>
                    <p class="text-sm text-gray-500">(R$ ${(result.costPerKg * 5.2).toFixed(2)}/kg - Cotação aproximada)</p>
                    <p class="text-xs text-gray-400 mt-2">* Preencha o peso para ver o valor total estimado</p>
                </div>
            `;
        }
    } else {
        // Para marítimo: custo para container de 20-22 toneladas
        resultHTML += `
            <div class="bg-gray-100 p-4 rounded-lg mb-6">
                <p class="text-sm text-gray-600 mb-1">Custo Estimado de Frete para Container (20-22 toneladas):</p>
                <p class="text-2xl font-bold text-gray-900">USD ${result.totalCost.toFixed(2)}</p>
                <p class="text-sm text-gray-500">(R$ ${(result.totalCost * 5.2).toFixed(2)} - Cotação aproximada)</p>
                <p class="text-xs text-gray-400 mt-2">* Container de 20 pés (até 22 toneladas)</p>
            </div>
        `;
    }
    
    // Tempo de trânsito (para ambas modalidades)
    resultHTML += `
        <div class="mt-6 text-center">
            <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Tempo de Trânsito:</p>
                <p class="text-lg font-bold text-gray-800">${result.transitDays.min}-${result.transitDays.max} dias</p>
            </div>
        </div>
    `;
    
    resultContent.innerHTML = resultHTML;
    
    // Mostrar seção de resultado e gerar gráfico
    showResultSections();
    generateFluctuationChart(result);
}

// Gerar gráfico de flutuação de custos
function generateFluctuationChart(currentResult) {
    const ctx = document.getElementById('fluctuationChart').getContext('2d');
    
    // Gerar dados fictícios dos últimos 3 meses
    const currentMonth = new Date().getMonth();
    const last3Months = [];
    
    for (let i = 2; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        last3Months.push(monthNames[monthIndex]);
    }
    
    // Gerar dados de flutuação baseados no resultado atual
    const basePrice = currentResult.totalCost || currentResult.costPerKg;
    const fluctuationData = [];
    
    for (let i = 0; i < 3; i++) {
        // Variação de ±15% do preço atual
        const variation = (Math.random() - 0.5) * 0.3; // -15% a +15%
        const price = basePrice * (1 + variation);
        fluctuationData.push(price.toFixed(2));
    }
    
    // Garantir que o último valor seja próximo ao atual
    fluctuationData[2] = basePrice.toFixed(2);
    
    // Destruir gráfico anterior se existir
    if (window.fluctuationChart) {
        window.fluctuationChart.destroy();
    }
    
    // Criar novo gráfico
    window.fluctuationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last3Months,
            datasets: [{
                label: `Custo ${currentResult.modality} (USD)`,
                data: fluctuationData,
                borderColor: '#374151',
                backgroundColor: 'rgba(55, 65, 81, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#374151',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#374151',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Custo: USD ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#e5e7eb'
                    },
                    ticks: {
                        color: '#6b7280',
                        callback: function(value) {
                            return 'USD ' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        color: '#e5e7eb'
                    },
                    ticks: {
                        color: '#6b7280'
                    }
                }
            }
        }
    });
}

// Mostrar loading
function showLoading() {
    document.getElementById('loading').classList.add('active');
    hideResultSections();
}

// Esconder loading
function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

// Mostrar seções de resultado
function showResultSections() {
    document.getElementById('resultCard').classList.add('active');
    document.getElementById('chartSection').classList.add('active');
}

// Esconder seções de resultado
function hideResultSections() {
    document.getElementById('resultCard').classList.remove('active');
    document.getElementById('chartSection').classList.remove('active');
}

// Resetar formulário
function resetForm() {
    document.getElementById('freteForm').reset();
    hideResultSections();
    hideLoading();
    
    // Esconder campos condicionais
    const aereoFields = document.getElementById('aereoFields');
    aereoFields.style.display = 'none';
    aereoFields.classList.remove('show');
    
    // Destruir gráfico se existir
    if (window.fluctuationChart) {
        window.fluctuationChart.destroy();
        window.fluctuationChart = null;
    }
}

