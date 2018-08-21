const { devices, maxPower, rates } = require("../data/input.json")
var Combinatorics = require('js-combinatorics');

class Schedule {
    constructor({ devices, maxPower, rates, modes }) {
        this.schedule = {};
        this.consumedEnergy = { value: 0, devices: {} };
        this._hourlyRates = [];
        this._devices = [];
        this.maxPower = maxPower;
        this.modes = modes;

        rates.forEach(rate => this.addRate(rate));
        devices.forEach(device => this.addDevice(device));

        this._makeSchedule();
    }

    _makeSchedule() {
        for (let hour = 0; hour < 24; hour++) {
            if (!this._hourlyRates[hour]) {
                throw "The rates are missing or incomplete";
            }
            this.schedule[hour] = [];
        }

        this._devices.sort(byCountOfPossibleStartTimes);

        this._devices.forEach(device => {
            device.possibleStartTimes.sort(byPriceThenByTime);

            device.possibleStartTimes.forEach(possibleStartTime => {
                // check maxPower violations
                const startTime = possibleStartTime.startTime;
                for (let hour = startTime; hour < device.duration + startTime; hour++) {
                    // const totalPowerForTheHour = this.schedule[hour].reduce((accumulator, currentValue) => accumulator + this._devices[currentValue].power, );

                }

            });

            const startTime = device.possibleStartTimes[0].startTime;
            for (let hour = startTime; hour < device.duration + startTime; hour++) {
                this.schedule[hour].push(device.id);
            }

            let test = groupBy(device.possibleStartTimes, "price");

            device.possibleStartTimes.forEach(startTime => {
            });
        });

        // let allPossibleStartTimes = this._devices.map(d => d.possibleStartTimes.filter(t => t.price == d.possibleStartTimes[0].price));
        let allPossibleStartTimes = this._devices.map(d => d.possibleStartTimes);
        let scheduleCandidates = Combinatorics.cartesianProduct(...allPossibleStartTimes)
        // let scheduleCandidatesArray = cp.toArray();

        loop1:
        while (true) {
            const scheduleCandidate = scheduleCandidates.next();
            if (!scheduleCandidate) {
                throw "Failed to create the schedule"
            }

            const schedule = {};
            const consumedEnergy = { value: 0, devices: {} };
            for (let hour = 0; hour < 24; hour++) {
                schedule[hour] = [];
                let powerByAllDevicesForTheHour = 0;
                for (const key in scheduleCandidate) {
                    if (!scheduleCandidate.hasOwnProperty(key)) {
                        continue;
                    }
                    const deviceRun = scheduleCandidate[key];
                    if (hour >= deviceRun.startTime && hour <= deviceRun.startTime + deviceRun.device.duration) {
                        schedule[hour].push(deviceRun.device.id);
                        powerByAllDevicesForTheHour += deviceRun.device.power;
                    }
                }
                if (powerByAllDevicesForTheHour > this.maxPower) {
                    continue loop1;
                }
            }
            
            consumedEnergy.devices[deviceRun.device.id] = deviceRun.price;
            consumedEnergy.value += deviceRun.price;
            // return the best schedule
            this.schedule = schedule;
            this.consumedEnergy = consumedEnergy;
            break;
        }

        const bestTotalPrice = this._devices.reduce((totalPrice, device) => totalPrice + device.possibleStartTimes[0].price, 0)

    }

    addRate(rate) {
        if (!rate.from || !rate.to || !rate.value) {
            throw "Mandatory parameter is missing";
        }

        if (rate.from < 0 || rate.to > 23)
            throw "Illegal time";

        let hour = rate.from;
        while (hour != rate.to) {
            this._hourlyRates[hour] = rate.value;
            hour = addHours(hour, 1);
        }
    }

    addDevice(device) {
        if (this._devices.findIndex(d => d === device) !== -1) {
            throw `Error: The device is already added: ${device.name}`;
        }

        if (device.power > this.maxPower) {
            throw `Error: The device ${device.name} exceeds the power limit of ${this.maxPower}`;
        }

        device.possibleStartTimes = [];
        // this._setDeviceModeTimes(device);

        for (let hour = 0; hour <= 24 - device.duration; hour++) {
            if (this._isTimeOkForDeviceMode(hour, device.mode)) {
                const price = this._getDeviceRunPrice(device, hour);
                device.possibleStartTimes.push({ startTime: hour, price, device });
            }
        }

        if (device.possibleStartTimes.length == 0) {
            throw "The device could not be added to the schedule";
        }

        this._devices.push(device);
    }

    _isTimeOkForDeviceMode(time, mode) {
        if (mode == "day" && (time < 7 || time >= 21)) {
            return false;
        }

        if (mode == "night" && time >= 7 && time < 21) {
            return false;
        }

        return true;
    }

    _getDeviceRunPrice(device, startTime) {
        let price = 0;
        for (let hour = startTime; hour < device.duration + startTime; hour++) {
            price += (device.power / 1000) * this._hourlyRates[hour];
        }

        // let hour = startTime;
        // const endTime = addHours(hour, device.duration);
        // while (hour != endTime) {
        //     price += (device.power / 1000) * this._hourlyRates[hour];
        //     hour = addHours(hour, 1);
        // }

        // return price.toFixed(2);
        return Math.round(price * 100) / 100
    }

    _setDeviceModeTimes(device) {
        if (!device.mode) {
            device.mode = {
                from: 0,
                to: 23,
                hours: new Array(24)
            };
        } else {
            device.mode = this.modes[device.mode];
        }
    }
}

function subtractHours(x, y) {
    let difference = x - y;
    if (difference < 0) {
        return difference + 24;
    } else {
        return difference;
    }
}

function addHours(x, y) {
    let sum = x + y;
    if (sum > 23) {
        return sum - 24;
    } else {
        return sum;
    }
}

const byPriceThenByTime = (a, b) => {
    const byPrice = a.price - b.price;
    const byTime = a.startTime - b.startTime;
    if (byPrice == 0) {
        return byTime;
    }
    return byPrice;
}

const byCountOfPossibleStartTimes = (a, b) => a.possibleStartTimes.length - b.possibleStartTimes.length;

const modes = {
    day: {
        from: 7,
        to: 21
    },
    night: {
        from: 21,
        to: 7
    }
}

const groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

const schedule = new Schedule({ devices, maxPower, rates, modes })

module.exports = Schedule;
