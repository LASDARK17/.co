// URL pública de tu hoja de cálculo en formato CSV
const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQw.../pub?gid=0&single=true&output=csv';

async function fetchData() {
    const res = await fetch(sheetUrl);
    const data = await res.text();
    return parseCSV(data);
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).filter(line => line.trim());

    return rows.map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, i) => {
            obj[header.trim()] = values[i]?.trim() || '';
            return obj;
        }, {});
    });
}

let totalReservas = 0;
let reservasHoy = 0;
let confirmadas = 0;
let pendientes = 0;
let canceladas = 0;

let reservasPorDia = {};
let serviciosCount = {};
let reservasMensuales = {};

async function processData() {
    const data = await fetchData();

    // Fecha actual para comparar reservas de hoy
    const today = new Date().toISOString().split('T')[0];

    data.forEach(reserva => {
        const estado = reserva.Estado.toLowerCase();
        const servicio = reserva["Tipo de Servicio"];
        const fecha = reserva.Fecha.split(' ')[0]; // Solo la parte de la fecha

        // Conteo general
        totalReservas++;

        // Reservas de hoy
        if (fecha === today) reservasHoy++;

        // Estado de reservas
        switch (estado) {
            case "completado":
                confirmadas++;
                break;
            case "pendiente":
                pendientes++;
                break;
            case "cancelado":
                canceladas++;
                break;
        }

        // Reservas por día
        if (!reservasPorDia[fecha]) reservasPorDia[fecha] = 0;
        reservasPorDia[fecha] += 1;

        // Servicios más solicitados
        if (!serviciosCount[servicio]) serviciosCount[servicio] = 0;
        serviciosCount[servicio] += 1;

        // Reservas mensuales
        const monthYear = `${new Date(fecha).getMonth() + 1}-${new Date(fecha).getFullYear()}`;
        if (!reservasMensuales[monthYear]) reservasMensuales[monthYear] = 0;
        reservasMensuales[monthYear] += 1;
    });

    updateStats();
    drawCharts();
    populateTable(data);
}

function updateStats() {
    document.getElementById("reservas-hoy").textContent = reservasHoy;
    document.getElementById("confirmadas").textContent = confirmadas;
    document.getElementById("pendientes").textContent = pendientes;
    document.getElementById("canceladas").textContent = canceladas;
}

function drawCharts() {
    // Reservas por Servicio
    const ctx1 = document.getElementById('chartServicios').getContext('2d');
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: Object.keys(serviciosCount),
            datasets: [{
                label: 'Servicios más solicitados',
                data: Object.values(serviciosCount),
                backgroundColor: ['#f39c12','#e74c3c','#2ecc71','#9b59b6'] 
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Reservas Mensuales
    const ctx2 = document.getElementById('chartMensual').getContext('2d');
    new Chart(ctx2, {
        type: 'line',
        data: {
            labels: Object.keys(reservasMensuales),
            datasets: [{
                label: 'Reservas Mensuales',
                data: Object.values(reservasMensuales),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            }
        }
    });
}

function populateTable(data) {
    const tableBody = document.getElementById('reservations-table-body');
    tableBody.innerHTML = ''; // Limpiar contenido previo

    data.forEach(reserva => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reserva.Fecha}</td>
            <td>${reserva.Hora}</td>
            <td>${reserva["Tipo de Servicio"]}</td>
            <td>${reserva.Estado}</td>
            <td>
                <button class="action-btn">Editar</button>
                <button class="action-btn">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

processData();