// Constants and initial conditions
const b = 4; // Ns/m
const L = 0.25; // m
const c = 200; // m/s
const n = 100;
const delta_x = L / n;
const delta_t = delta_x / (c * Math.sqrt(2)); // stability condition
const f = 1 / delta_t;
console.log('Sampling frequency is', f, 'Hz');

let y = pluck(0.1, 0.007);
let v = math.zeros(n).toArray();

// Prepare data for plotting
const x = [...Array(n).keys()].map(i => i * delta_x);

// Setup Plotly plot
const plotDiv = document.getElementById('plot');
const trace = {
    x: x,
    y: y,
    mode: 'lines',
    name: 'String Displacement',
    line: {color: 'red'}
};
const layout = {
    title: 'String Displacement Over Time',
    xaxis: {
        title: 'x (position along the string, in m)',
        range: [0, L]  // Set the range of the x-axis from 0 to L (length of the string)
    },
    yaxis: {
        title: 'y (vertical displacement, in m)',
        range: [-0.01, 0.01]  // Set the range of the y-axis from -0.01 to 0.01 meters
    },
    showlegend: false
};
Plotly.newPlot(plotDiv, [trace], layout);

// Update the plot in real-time
function updatePlot() {
    [y, v] = timestep(y, v);
    Plotly.animate(plotDiv, {
        data: [{y: y}],
        traces: [0],
        layout: {}
    }, {
        transition: {
            duration: 0,
        },
        frame: {
            duration: 0,
            redraw: true
        }
    });
}

// Run the simulation and update the plot every few milliseconds
setInterval(updatePlot, 1);

// Functions used in the simulation
function pluck(l, delta_y) {
    const y = math.zeros(n).toArray();
    const n_displaced = parseInt(n * (l / L));
    for (let i = 1; i < n_displaced; i++) {
        y[i] = (i / n_displaced) * delta_y;
    }
    for (let i = n_displaced; i < n - 1; i++) {
        y[i] = (1 - (i - n_displaced + 1) / (n - n_displaced)) * delta_y;
    }
    return y;
}

function partial_x2(y) {
    const y_right = y.slice(1);
    const y_left = y.slice(0, -1);
    y_right.push(0);
    y_left.unshift(0);
    return y_right.map((yr, i) => (yr - 2 * y[i] + y_left[i]) / Math.pow(delta_x, 2));
}

function timestep(y, v) {
    const d2y_dx2 = partial_x2(y);
    const d2y_dt2 = math.subtract(math.multiply(math.square(c), d2y_dx2), math.multiply(b, v));
    v = math.add(v, math.multiply(d2y_dt2, delta_t));
    y = math.add(y, math.multiply(v, delta_t));
    return [y, v];
}