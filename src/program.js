const { devices, maxPower, rates } = require("../data/input.json")

class Schedule {
    constructor({ devices, maxPower, rates }) {
        this.schedule = [];
        this.consumedEnergy = { value: 0, devices: {} };

        devices.forEach(device => {

        });
    }
}

const schedule = new Schedule({ devices, maxPower, rates })