'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workout-container');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const inputElevationParent = inputElevation.closest('.form__row');
const inputCadenceParent = inputCadence.closest('.form__row');

function uuidGenerator() {
  function ff(s) {
    var pt = (Math.random().toString(16) + '000000000').substr(2, 8);
    return s ? '-' + pt.substr(0, 4) + '-' + pt.substr(4, 4) : pt;
  }
  return ff() + ff(true) + ff(true) + ff();
}

// type, duration, distance, cadence, lat, lng

class workout {
  constructor(type, duration, distance, lat, lng) {
    this.date = new Date();
    this.id = type + uuidGenerator();
    this.type = type;
    this.duration = duration;
    this.distance = distance;
    this.lat = lat;
    this.lng = lng;
  }
}

class running extends workout {
  constructor(type, duration, distance, cadence, lat, lng) {
    super(type, duration, distance, lat, lng);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class cycling extends workout {
  constructor(type, duration, distance, elevgain, lat, lng) {
    super(type, duration, distance, lat, lng);
    this.elevgain = elevgain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #mymap;
  #clickedPosition;

  constructor() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(this._getPosition.bind(this));
    }
    this.workouts = new Map();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    window.addEventListener('unload', this._unload.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._setViewToWorkout.bind(this)
    );
  }

  _getPosition(position) {
    const { latitude, longitude } = position.coords;
    this.#mymap = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#mymap);

    this.#mymap.on('click', this._showForm.bind(this));
    this._loadMap().bind(this);
  }

  _loadMap() {
    if (localStorage.getItem('workouts')) {
      const workOutObj = JSON.parse(localStorage.getItem('workouts'));
      for (let [key, value] of Object.entries(workOutObj)) {
        this.workouts.set(key, value);
      }
      this.workouts.forEach(workout => {
        this._createElement(workout);
        this._addMarkers(workout.lat, workout.lng);
      });
    }
  }

  _addMarkers(lat, lng) {
    L.marker([lat, lng])
      .addTo(this.#mymap)
      .bindPopup(
        `${inputType.value} on ${months[new Date().getMonth()]} for ${
          inputDuration.value
        } mins`
      )
      .openPopup();
  }

  _createCycling(element) {
    return ` <h2 class="workout__title">
    ${element.type} on ${months[element.date.getMonth()]} for ${
      element.duration
    } mins
    </h2>
        <div class="workout__details">
            <span class="workout__icon">🚲</span>
            <span class="workout__value">${element.distance}</span>
            <span class="workout__unit">km</span>
        </div>
  
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${element.duration}</span>
            <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Math.trunc(
              (element.distance * 60) / element.duration
            )}</span>
            <span class="workout__unit">km/hr</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🎿</span>
            <span class="workout__value">${element.elevgain}</span>
            <span class="workout__unit">metres</span>
        </div>`;
  }

  _createRunning(element) {
    return ` <h2 class="workout__title">
    ${element.type} on ${months[element.date.getMonth()]} for ${
      element.duration
    } mins
    </h2>
        <div class="workout__details">
            <span class="workout__icon">🏃‍♂️</span>
            <span class="workout__value">${element.distance}</span>
            <span class="workout__unit">km</span>
        </div>
  
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${element.duration}</span>
            <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${Math.trunc(
              element.duration / element.distance
            )} </span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${element.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>`;
  }

  _createElement(element) {
    let myElm = document.createElement('li');

    myElm.setAttribute('id', `${element.id}`);

    if (element.type === 'running') {
      myElm.classList.add('workout', 'workout--running');
      myElm.innerHTML = this._createRunning(element);
    } else {
      myElm.classList.add('workout', 'workout--cycling');
      myElm.innerHTML = this._createCycling(element);
    }

    containerWorkouts.append(myElm);
  }

  _resetElevCad() {
    inputCadenceParent.classList.remove('form__row--hidden');
    inputElevationParent.classList.remove('form__row--hidden');
    inputElevationParent.classList.add('form__row--hidden');
  }

  _showForm(event) {
    form.classList.remove('hidden');
    this.#clickedPosition = event;
  }

  _toggleElevationField(event) {
    event.preventDefault();
    inputCadenceParent.classList.toggle('form__row--hidden');
    inputElevationParent.classList.toggle('form__row--hidden');
  }

  _newWorkout(event) {
    form.classList.add('hidden');
    event.preventDefault();

    const { lat, lng } = this.#clickedPosition.latlng;

    let cyclingObj;
    let runningObj;

    if (inputType.value === 'running') {
      runningObj = new running(
        inputType.value,
        inputDuration.value,
        inputDistance.value,
        inputCadence.value,
        lat,
        lng
      );
      console.log(runningObj);
      this.workouts.set(runningObj.id, runningObj);
      this._createElement(runningObj);
    } else if (inputType.value === 'cycling') {
      cyclingObj = new cycling(
        inputType.value,
        inputDuration.value,
        inputDistance.value,
        inputElevation.value,
        lat,
        lng
      );
      this.workouts.set(cyclingObj.id, cyclingObj);
      this._createElement(cyclingObj);
    }

    this._addMarkers(lat, lng);
    form.reset();
    this._resetElevCad();
  }

  _setViewToWorkout(event) {
    const parent = event.target.closest('.workout');
    const { lat, lng } = this.workouts.get(parent.id);

    this.#mymap.setView(L.latLng(lat, lng));
  }

  _unload() {
    const newObj = {};

    for (let [key, value] of this.workouts.entries()) {
      newObj[key] = value;
    }

    localStorage.setItem('workouts', JSON.stringify(newObj));
  }
}

const app = new App();
