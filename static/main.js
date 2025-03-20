import { Lekarz, Wizyta } from "./api.js";

function hourToFloat(hour) {
    return parseInt(hour.split(':')[0]) + hour.split(':')[1] / 60;
}

function floatToHour(hour) {
    return hour.toFixed(2).split('.')[0] + ':' + Math.round(hour.toFixed(2).split('.')[1] * 0.6).toString().padStart(2, '0');
}

function getHoursForDay(appointments, hourFrom, hourTo, day) {
    hourFrom = hourToFloat(hourFrom);

    if (day.split('T')[0] === new Date().toISOString().split('T')[0]) {
        hourFrom = new Date().getHours() +  new Date().getMinutes() / 60;
        hourFrom = Math.ceil(hourFrom * 4) / 4
    }

    hourTo = hourToFloat(hourTo);

    const hours = [];
    const appointmentsToday = appointments
        .filter(a => a.split('T')[0] === day.split('T')[0])
        .map(a => hourToFloat(a.split('T')[1]));
    for (let i = hourFrom; i < hourTo; i += 0.25) {
        if (new Date(day.split('T')[0]).getDate() === 28) {
            console.log(i, appointmentsToday);
        }
        hours.push({hour: floatToHour(i), busy: appointmentsToday.includes(i)});
    }
    return hours;
}

function getRelativeDate(date) {
    if (date.split('T')[0] === new Date().toISOString().split('T')[0]) {
        return 'dzisiaj'
    }

    date = new Date(date);
    date.setDate(date.getDate() - 1)
    if (date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
        return 'jutro'
    }

    date.setDate(date.getDate() + 1)
    return date.getDate().toString().padStart(2, '0') + '.' + date.getMonth().toString().padStart(2, '0')
}

const dialog = document.querySelector('#dialog');
const dialogCloseButton = document.querySelector('#dialog header button');
const dialogTitle = document.querySelector('#dialog header h3');
const dialogMain = document.querySelector('#dialog main');

const doctorListDiv = document.querySelector('#doctor-list');
const appointmentListDiv = document.querySelector('#appointment-list');

dialogCloseButton.onclick = () => dialog.classList.remove('shown');

function setupCalendar(data) {
    const calendar = document.querySelector('#calendar');
    const timeSelect = document.querySelector('#time-select');

    flatpickr(calendar, {
        locale: 'pl',
        altInput: true,
        altFormat: 'j M Y',
        disable: [
            date => {
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);
                const is_weekend = date.getDay() === 0 || date.getDay() === 6;
                const is_past = date.getTime() < todayMidnight.getTime();
                date.setMonth(date.getMonth(), date.getDate() + 1)
                const is_busy = !getHoursForDay(data.dates, data.godzina_od, data.godzina_do, date.toISOString())
                return is_weekend || is_past || is_busy;
            }
        ]
    })

    calendar.onchange = () => {
        console.log(data.dates);
        const date = calendar.value;
        const hours = getHoursForDay(data.dates, data.godzina_od, data.godzina_do, date);
        console.log(hours);
        timeSelect.innerHTML = hours.map(h => `<option ${h.busy ? 'disabled' : ''}>${h.hour}</option>`).join('');
    }
}

async function openAppointmentModal(id) {
    const appointment = await Wizyta.retrieve(id)
    dialogTitle.textContent = appointment.imie + ' ' + appointment.nazwisko
    dialogMain.innerHTML = `
        <div class="appointment-form">
            <label for="calendar">Data</label>
            <label for="time-select">Godzina</label>
            <div></div>

            <input id="calendar">
            <select id="time-select">
                <option selected>--:--</option>
            </select>
            <button onclick="await submitAppointment(${data.id})">Umów wizytę</button>
        </div>
    `

    setupCalendar(appointment);

    dialog.classList.add('shown');
}

async function submitAppointment(doctorId) {
    const calendar = document.querySelector('#calendar');
    const timeSelect = document.querySelector('#time-select');
    const date = calendar.value;
    const hour = timeSelect.value;

    await Wizyta.create(doctorId, date + 'T' + hour.padStart(5, '0') + ':00')

    await displayAppointments()
}

async function displayAppointments() {
    const data = await Wizyta.list()

    appointmentListDiv.innerHTML = data
        .sort((a, b) => new Date(a.data_wizyty) - new Date(b.data_wizyty))
        .map(d => `
            <div class="appointment">
                <div class="date">
                    <h4>${d.data_wizyty.split('T')[1].slice(0, 5)}</h4>
                    <span>${getRelativeDate(d.data_wizyty)}</span>
                </div>
                <div class="name">
                    <h4>${d.lekarz.imie} ${d.lekarz.nazwisko}</h4>
                    <p>${d.lekarz.specjalizacja}</p>
                </div>
                <button class="danger">
                    Odwołaj
                </button>
            </div>
        `)
        .join('')
}

async function displayDoctors() {
    const data = await Lekarz.list()
    doctorListDiv.innerHTML = data
        .map(d => `
            <div class="doctor">
                <div class="name">
                    <h3>${d.imie} ${d.nazwisko}</h3>
                    <p>${d.specjalizacja}</p>
                </div>
                <p>Dostępny w piątek</p>
                <button onclick="openAppointmentModal(${d.id})">Umów wizytę</button>
            </div>
        `)
        .join('')
}

displayAppointments();
displayDoctors();