const Schedule = require("./program")
const { devices, maxPower, rates } = require("../data/input.json")

const schedule = new Schedule({ devices, maxPower, rates })

// test('schedule to be empty', () => {
//     expect(schedule.schedule).toEqual({});
// });

test('throw on adding illegal rate', () => {
    expect(() => schedule.addRate({from: 1, to: 25, value: 1})).toThrow();
    // expect(schedule.hourlyRates[1]).toBeUndefined();
});

test('throw on mandatory param missing', () => {
    expect(() => schedule.addRate({from: 1, to: 20})).toThrow();
    // expect(schedule.hourlyRates[1]).toBeUndefined();
});