function getCookie(name) {
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

const dialog = document.querySelector('#dialog');
const dialogCloseButton = document.querySelector('#dialog header button');
const dialogTitle = document.querySelector('#dialog header h3');
const dialogMain = document.querySelector('#dialog main');

const doctorListDiv = document.querySelector('#doctor-list');

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

function openAppointmentModal(id) {
    fetch(`/api/lekarz/${id}/`)
        .then(response => response.json())
        .then(data => {
            dialogTitle.textContent = data.imie + ' ' + data.nazwisko;
            dialogMain.innerHTML = `
                <div class="appointment-form">
                    <label for="calendar">Data</label>
                    <label for="time-select">Godzina</label>
                    <div></div>

                    <input id="calendar">
                    <select id="time-select">
                        <option selected>--:--</option>
                    </select>
                    <button onclick="submitAppointment(${data.id})">Umów wizytę</button>
                </div>
            `;

            setupCalendar(data);
        });

    dialog.classList.add('shown');
}

function submitAppointment(doctorId) {
    const calendar = document.querySelector('#calendar');
    const timeSelect = document.querySelector('#time-select');
    const date = calendar.value;
    const hour = timeSelect.value;

    fetch('/api/wizyta/', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            lekarz: doctorId,
            data_wizyty: date + 'T' + hour.padStart(5, '0') + ':00',
        })
    })
        .then(() => dialog.classList.remove('shown'))
}

fetch('/api/lekarz/')
    .then(response => response.json())
    .then(data => doctorListDiv.innerHTML = data.map(d => `
        <div class="doctor">
            <div class="name">
                <h3>${d.imie} ${d.nazwisko}</h3>
                <p>${d.specjalizacja}</p>
            </div>
            <p>Dostępny w piątek</p>
            <button onclick="openAppointmentModal(${d.id})">Umów wizytę</button>
        </div>
    `).join(''));