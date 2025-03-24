class Lekarz {
    static cache = {}

    constructor(id, imie, nazwisko, specjalizacja, godzina_od, godzina_do, dates) {
        this.id = id
        this.imie = imie
        this.nazwisko = nazwisko
        this.specjalizacja = specjalizacja
        const dateFrom = new Date('1970-01-01T' + godzina_od)
        this.godzina_od = dateFrom.getHours() + dateFrom.getMinutes() / 60
        const dateTo = new Date('1970-01-01T' + godzina_do)
        this.godzina_do = dateTo.getHours() + dateFrom.getMinutes() / 60
        this.dates = dates.map(date => new Date(date))
    }

    static async list() {
        console.log('Lekarz.list');
        const response = await fetch('/api/lekarz/');
        const doctors = await response.json()
        return doctors.map(doctor => {
            const lekarz =  new Lekarz(
                doctor.id, doctor.imie, doctor.nazwisko, doctor.specjalizacja, doctor.godzina_od, doctor.godzina_do, doctor.dates
            )
            this.cache[doctor.id] = lekarz
            return lekarz
        });
    }

    static async retrieve(id) {
        if (id in this.cache) {
            console.log('Lekarz.retrieve (from cache)')
            return this.cache[id]
        }
        console.log('Lekarz.retrieve');
        const response = await fetch(`/api/lekarz/${id}/`)
        const doctor = await response.json()
        const doctorObject = new Lekarz(
            doctor.id, doctor.imie, doctor.nazwisko, doctor.specjalizacja, doctor.godzina_od, doctor.godzina_do, doctor.dates
        );
        this.cache[id] = doctorObject
        return doctorObject
    }
}

class Wizyta {
    constructor(id, pacjent, lekarz, data_wizyty, status) {
        this.id = id;
        this.pacjent = pacjent;
        this.lekarz = lekarz;
        this.data_wizyty = new Date(data_wizyty);
        this.status = status;
    }

    static async list() {
        console.log('Wizyta.list');
        const response = await fetch('/api/wizyta/');
        const appointments = await response.json();
        return Promise.all(appointments.map(
            async a => new Wizyta(a.id, a.pacjent, await Lekarz.retrieve(a.lekarz), a.data_wizyty, a.status))
        );
    }

    static async retrieve(id) {
        console.log('Lekarz.retrieve');
        const response = await fetch(`/api/wizyta/${id}/`)
        const a = await response.json()
        return new Wizyta(a.id, a.pacjent, await Lekarz.retrieve(a.lekarz), a.data_wizyty, a.status);
    }

    static async create(lekarz, data_wizyty) {
        console.log('Lekarz.create');
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

function compareDates(date1, date2) {
    date1 = new Date(date1.getTime())
    date2 = new Date(date2.getTime())

    date1.setHours(0, 0, 0, 0)
    date2.setHours(0, 0, 0, 0)

    return Math.ceil((date1 - date2) / (1000 * 60 * 60 * 24));
}

function getHoursForDay(doctor, day) {
    let dateFrom;
    if (compareDates(day, new Date()) === 0) {
        dateFrom = new Date()
    } else {
        dateFrom = new Date(day.getTime());
        dateFrom.setHours(Math.floor(doctor.godzina_od), Math.floor(doctor.godzina_od * 60 % 60))
    }

    let dateTo = new Date(day.getTime());
    dateTo.setHours(Math.floor(doctor.godzina_do), Math.floor(doctor.godzina_do * 60 % 60))

    if (dateFrom > dateTo) {
        return []
    }

    const appointmentsOnDay = doctor.dates.filter(d => compareDates(d, day) === 0)
    const hours = []

    for (let date = dateFrom; date < dateTo; date.setHours(date.getHours(), date.getMinutes() + 15)) {
        hours.push({hour: new Date(date.getTime()), busy: appointmentsOnDay.some(
            a => a.getHours() === date.getHours() && a.getMinutes() === date.getMinutes()
        )})
    }

    return hours
}

function getFirstAvailableDate(doctor) {
    const day = new Date();
    let firstDate = null;
    while (true) {
        if (getHoursForDay(doctor, day).length !== 0) {
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

    if (compareDates(date, new Date()) === 0) {
        return 'dzisiaj'
    }

    if (compareDates(date, new Date()) === 1 && date > new Date()) {
        return 'jutro'
    }

    if (compareDates(date, new Date()) <= 7 && date > new Date()) {
        return WEEKDAYS[date.getDay()]
    }

    return date.getDate().toString().padStart(2, '0') + '.' + (date.getMonth() + 1).toString().padStart(2, '0')
}

const dialog = document.querySelector('#dialog');
const dialogCloseButton = document.querySelector('#dialog header button');
const dialogTitle = document.querySelector('#dialog header h3');
const dialogMain = document.querySelector('#dialog main');

const searchInput = document.querySelector('#search');

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
                const firstAvailableDate = getFirstAvailableDate(data);
                firstAvailableDate.setHours(0, 0, 0, 0)
                const is_weekend = date.getDay() === 0 || date.getDay() === 6;
                const is_past = date.getTime() < firstAvailableDate.getTime();
                date.setMonth(date.getMonth(), date.getDate() + 1)
                const is_busy = !getHoursForDay(data, date)
                return is_weekend || is_past || is_busy;
            }
        ]
    })

    calendar.onchange = () => {
        const date = new Date(calendar.value);
        const hours = getHoursForDay(data, date);
        timeSelect.innerHTML = hours.map(h => `
            <option ${h.busy ? 'disabled' : ''}>${h.hour.getHours().toString().padStart(2, '0')}:${h.hour.getMinutes().toString().padStart(2, '0')}</option>
        `).join('');
    }
}

async function openAppointmentModal(id) {
    const doctor = await Lekarz.retrieve(id)
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

    const tzOffset = -new Date(date).getTimezoneOffset()
    const dateString = date + 'T' + hour.padStart(5, '0') + ':00'
        + (tzOffset < 0 ? '-' : '+') + Math.abs(Math.floor(tzOffset / 60)).toString().padStart(2, '0')
        + ':' + Math.abs(tzOffset % 60).toString().padStart(2, '0')

    await Wizyta.create(doctorId, dateString)

    await displayAppointments()

    dialog.classList.remove('shown')
}

async function openCancelModal(id) {
    const appointment = await Wizyta.retrieve(id)
    dialogTitle.textContent = 'Odwołanie wizyty'
    dialogMain.innerHTML = `
        <p>
            Czy na pewno chcesz odwołać wizytę ${getRelativeDate(appointment.data_wizyty)} o 
            ${appointment.data_wizyty.getHours().toString().padStart(2, '0')}:${appointment.data_wizyty.getMinutes().toString().padStart(2, '0')}
            u lekarza ${appointment.lekarz.imie} ${appointment.lekarz.nazwisko}?
        </p>
        <button class="danger">Tak</button>
        <button>Nie</button>
    `

    dialog.classList.add('shown')
}

async function displayAppointments() {
    const data = await Wizyta.list()
    const filteredData = data.filter(
        a => a.status === 0 && new Date(a.data_wizyty) > new Date()
    )

    appointmentListDiv.innerHTML = filteredData
        .sort((a, b) => new Date(a.data_wizyty) - new Date(b.data_wizyty))
        .map(d => `
            <div class="appointment">
                <div class="date">
                    <h4>${d.data_wizyty.getHours().toString().padStart(2, '0')}:${d.data_wizyty.getMinutes().toString().padStart(2, '0')}</h4>
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

function displayDoctors(data) {
    doctorListDiv.innerHTML = data
        .sort((a, b) => {
            if (a.nazwisko < b.nazwisko) return -1
            if (a.nazwisko > b.nazwisko) return 1
            return 0
        })
        .map(doctor => `
            <div class="doctor">
                <div class="name">
                    <h3>${doctor.imie} ${doctor.nazwisko}</h3>
                    <p>${doctor.specjalizacja}</p>
                </div>
                <p>Dostępny/a ${getRelativeDate(getFirstAvailableDate(doctor))}</p>
                <button onclick="openAppointmentModal(${doctor.id})">Umów wizytę</button>
            </div>
        `)
        .join('')
}

async function loadDoctors() {
    const doctors = await Lekarz.list();
    displayDoctors(doctors);

    searchInput.onkeyup = () => {
        displayDoctors(doctors.filter(
            doctor =>
                (doctor.imie + ' ' + doctor.nazwisko).toLowerCase().includes(searchInput.value.toLowerCase())
                || doctor.specjalizacja.toLowerCase().includes(searchInput.value.toLowerCase())
        ))
    }
}

loadDoctors();
displayAppointments();
