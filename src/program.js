const { devices, maxPower, rates } = require("../data/input.json")

class Schedule {
    constructor({ devices, maxPower, rates }) {
        this.schedule = [];
        this.consumedEnergy = { value: 0, devices: {} };

        devices.forEach(device => {
            device.possibleStartTime = [];

            for (let index = 0; index <= 24 - device.duration; index++) {
                device.possibleStartTime.push(index)
            }
        });

    }
}

const schedule = new Schedule({ devices, maxPower, rates })

const hourlyRates = {};
for (let index = 0; index < 24; index++) {

}