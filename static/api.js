export class Lekarz {
    constructor(id, imie, nazwisko, specjalizacja, godzina_od, godzina_do) {
        this.id = id
        this.imie = imie
        this.nazwisko = nazwisko
        this.specjalizacja = specjalizacja
        this.godzina_od = godzina_od
        this.godzina_do = godzina_do
    }

    static async list() {
        const response = await fetch('/api/lekarz/');
        const data = await response.json()
        return data.map(d => new Lekarz(d.id, d.imie, d.nazwisko, d.specjalizacja, d.godzina_od, d.godzina_do));
    }

    static async retrieve(id) {
        const response = await fetch(`/api/lekarz/${id}/`)
        const data = await response.json()
        return new Lekarz(data.id, data.imie, data.nazwisko, data.specjalizacja, data.godzina_od, data.godzina_do);
    }
}

export class Wizyta {
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