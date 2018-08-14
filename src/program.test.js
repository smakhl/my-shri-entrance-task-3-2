const Schedule = require("./program")
const { devices, maxPower, rates } = require("../data/input.json")

const schedule = new Schedule({ devices, maxPower, rates })

test('schedule to be empty', () => {
    expect(schedule.schedule).toEqual({});
});