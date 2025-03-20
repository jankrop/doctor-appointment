class Lekarz {
    constructor(id, imie, nazwisko, specjalizacja, godzina_od, godzina_do, dates) {
        this.id = id
        this.imie = imie
        this.nazwisko = nazwisko
        this.specjalizacja = specjalizacja
        this.godzina_od = godzina_od
        this.godzina_do = godzina_do
        this.dates = dates
    }

    static async list() {
        const response = await fetch('/api/lekarz/');
        const data = await response.json()
        return data.map(d => new Lekarz(d.id, d.imie, d.nazwisko, d.specjalizacja, d.godzina_od, d.godzina_do, d.dates));
    }

    static async retrieve(id) {
        const response = await fetch(`/api/lekarz/${id}/`)
        const data = await response.json()
        return new Lekarz(data.id, data.imie, data.nazwisko, data.specjalizacja, data.godzina_od, data.godzina_do, data.dates);
    }
}

class Wizyta {
    constructor(id, pacjent, lekarz, data_wizyty, status) {
        this.id = id;
        this.pacjent = pacjent;
        this.lekarz = lekarz;
        this.data_wizyty = data_wizyty;
        this.status = status;
    }

    static async list() {
        const response = await fetch('/api/wizyta/');
        const data = await response.json();
        return await Promise.all(
            data.map(async d => new Wizyta(d.id, d.pacjent, await Lekarz.retrieve(d.lekarz), d.data_wizyty, d.status))
        );
    }

    static async retrieve(id) {
        const response = await fetch(`/api/wizyta/${id}/`)
        const data = await response.json()
        return new Wizyta(data.id, data.pacjent, await Lekarz.retrieve(data.lekarz), data.data_wizyty, data.status);
    }

    static async create(lekarz, data_wizyty) {
        const response = await fetch('/api/wizyta/', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                lekarz: lekarz,
                data_wizyty: data_wizyty,
            })
        })

        const data = await response.json()

        return new Wizyta(data.id, data.pacjent, await Lekarz.retrieve(data.lekarz), data.data_wizyty, data.status)
    }

    static async delete(id) {
        await fetch(`/api/wizyta/${id}/`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
        })
    }
}

function getCookie(name) {  // For the love of Zeus why is this not a built-in function in JavaScript
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Check if this cookie string begins with the name we want
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

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

function getFirstAvailableDate(doctor) {
    const day = new Date();
    let firstDate = null;
    while (true) {
        if (getHoursForDay(doctor.dates, doctor.godzina_od, doctor.godzina_do, day.toISOString()).length !== 0) {
            firstDate = day
            break
        }
        day.setDate(day.getDate() + 1)
    }
    return firstDate
}

function getRelativeDate(date, accusative) {
    const WEEKDAYS = accusative
        ? ['w niedzielę', 'w poniedziałek', 'w wtorek', 'w środę', 'w czwartek', 'w piątek', 'w sobotę']
        : ['nd.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];

    if (date.split('T')[0] === new Date().toISOString().split('T')[0]) {
        return 'dzisiaj'
    }

    date = new Date(date);
    date.setDate(date.getDate() - 1);  // Getting the date 1 day before to see if the date is tomorrow
    if (date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
        return 'jutro'
    }

    date.setDate(date.getDate() - 6);  // Getting the date a total 7 days before to see if the date is in a week
    if (date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
        date.setDate(date.getDate() + 7)  // Moving the date back
        return WEEKDAYS[date.getDay()]
    }

    date.setDate(date.getDate() + 7)  // Moving the date back
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

    console.log('first date for', data.imie, data.nazwisko, getFirstAvailableDate(data))

    flatpickr(calendar, {
        locale: 'pl',
        altInput: true,
        altFormat: 'j M Y',
        disable: [
            date => {
                const firstAvailableDate = getFirstAvailableDate(data);
                firstAvailableDate.setHours(0, 0, 0, 0)
                const is_weekend = date.getDay() === 0 || date.getDay() === 6;
                const is_past = date.getTime() < firstAvailableDate.getTime();
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
    const doctor = await Lekarz.retrieve(id)
    console.log(doctor)
    dialogTitle.textContent = doctor.imie + ' ' + doctor.nazwisko
    dialogMain.innerHTML = `
        <div class="appointment-form">
            <label for="calendar">Data</label>
            <label for="time-select">Godzina</label>
            <div></div>

            <input id="calendar">
            <select id="time-select">
                <option selected>--:--</option>
            </select>
            <button onclick="submitAppointment(${doctor.id})">Umów wizytę</button>
        </div>
    `

    setupCalendar(doctor);

    dialog.classList.add('shown');
}

async function submitAppointment(doctorId) {
    const calendar = document.querySelector('#calendar');
    const timeSelect = document.querySelector('#time-select');
    const date = calendar.value;
    const hour = timeSelect.value;

    await Wizyta.create(doctorId, date + 'T' + hour.padStart(5, '0') + ':00')

    await displayAppointments()

    dialog.classList.remove('shown')
}

async function displayAppointments() {
    const data = await Wizyta.list()

    appointmentListDiv.innerHTML = data
        .sort((a, b) => new Date(a.data_wizyty) - new Date(b.data_wizyty))
        .map(d => `
            <div class="appointment">
                <div class="date">
                    <h4>${d.data_wizyty.split('T')[1].slice(0, 5)}</h4>
                    <span>${getRelativeDate(d.data_wizyty, false)}</span>
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
        .map(doctor => `
            <div class="doctor">
                <div class="name">
                    <h3>${doctor.imie} ${doctor.nazwisko}</h3>
                    <p>${doctor.specjalizacja}</p>
                </div>
                <p>Dostępny ${getRelativeDate(getFirstAvailableDate(doctor).toISOString())}</p>
                <button onclick="openAppointmentModal(${doctor.id})">Umów wizytę</button>
            </div>
        `)
        .join('')
}

displayAppointments();
displayDoctors();