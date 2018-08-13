const { devices, maxPower, rates } = require("../data/input.json")

const HourlyRates = GetHourlyRates(rates);

class Schedule {
    constructor({ devices, maxPower, rates }) {
        this.schedule = [];
        this.consumedEnergy = { value: 0, devices: {} };

        devices.forEach(device => {
            device.possibleStartTime = [];

            for (let hour = 0; hour <= 24 - device.duration; hour++) {
                if (IsTimeUnsuitableForDevice(hour, device)) {
                    continue;
                }

                const price = GetDeviceRunPrice(HourlyRates, device, hour);
                device.possibleStartTime.push({ starttime: hour, price })
            }
        });

    }
}

const schedule = new Schedule({ devices, maxPower, rates })

function IsTimeUnsuitableForDevice(time, device) {
    if (device.mode == "day" && (time < 7 || time >= 21)) {
        return true;
    }

    if (device.mode == "night" && time >= 7 && time < 21) {
        return true;
    }

    return false;
}

function GetHourlyRates(rates) {
    const hourlyRates = {};
    rates.forEach(rate => {
        if (rate.from > rate.to) {
            for (let hour = rate.from; hour < 24; hour++) {
                hourlyRates[hour] = rate.value;
            }

            for (let hour = 0; hour < rate.to; hour++) {
                hourlyRates[hour] = rate.value;
            }
        }
        else {
            for (let hour = rate.from; hour < rate.to; hour++) {
                hourlyRates[hour] = rate.value;
            }
        }
    });
    return hourlyRates;
}

function GetDeviceRunPrice(hourlyRates, device, startTime) {
    let price = 0;
    for (let hour = startTime; hour < device.duration + startTime; hour++) {
        price += (device.power / 1000) * hourlyRates[hour];
    }
    return price;
}