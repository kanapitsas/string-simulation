// Constants and initial conditions
const b = 4; // Ns/m
const L = 0.25; // m
let c = 200; // m/s
let n = 100;
let delta_x = L / n;
let delta_t = delta_x / (c * Math.sqrt(2)); // stability condition
let f = 1 / delta_t;

let y = pluck(0.1, 0.007);
let v = math.zeros(n).toArray();

let isPaused = true;

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

// Prepare data for plotting
const x = [...Array(n).keys()].map(i => i * delta_x);

// Setup Plotly plot
const plotDiv = document.getElementById('plot');
const trace = {
    x: x,
    y: y,
    mode: 'lines',
    name: 'String Displacement',
    line: {color: 'brown'}
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
    if (!isPaused) {
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
        requestAnimationFrame(updatePlot); // Schedule the next frame
    }
}

requestAnimationFrame(updatePlot); // Start the animation loop

// --- DYNAMIC UPDATES ---

function interpolateArray(data, newLength) {
    const interpolated = new Array(newLength).fill(0);
    const factor = (data.length - 1) / (newLength - 1);
    for (let i = 0; i < newLength; i++) {
        const index = i * factor;
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const weight = index - lowerIndex;
        if (upperIndex >= data.length) {
            interpolated[i] = data[lowerIndex];
        } else {
            interpolated[i] = data[lowerIndex] * (1 - weight) + data[upperIndex] * weight;
        }
    }
    return interpolated;
}


function updateValue({ newN = n, newC = c }) {

    if (newC != c)
        c = newC;
        delta_t = delta_x / (c * Math.sqrt(2));

    if (newN != n) {
        const oldY = y.slice();  // Copy the current y array
        const oldV = v.slice();  // Copy the current v array

        n = newN;  // Update n with the new value
        delta_t = delta_x / (c * Math.sqrt(2));
        delta_x = L / n;
        f = 1/delta_t
        document.getElementById('frequency-display').textContent = f.toFixed(2) + ' Hz';

        // Interpolate the old arrays to fit the new size
        y = interpolateArray(oldY, n);
        v = interpolateArray(oldV, n);

        // Redraw the plot with the new setup
        Plotly.newPlot(plotDiv, [{
            x: [...Array(n).keys()].map(i => i * delta_x),
            y: y,
            mode: 'lines',
            line: {color: 'brown'}
        }], {
            title: 'String Displacement Over Time',
            xaxis: {title: 'x (m)', range: [0, L]},
            yaxis: {title: 'y (m)', range: [-0.01, 0.01]},
            showlegend: false
        });
    }
}

// Event listeners

document.getElementById('n-slider').addEventListener('input', function() {
    document.getElementById('n-value').textContent = this.value;
    updateValue({newN: parseInt(this.value)});
});

document.getElementById('c-slider').addEventListener('input', function() {
    document.getElementById('c-value').textContent = this.value;
    updateValue({newC: parseInt(this.value)});
});

document.getElementById('pause-btn').addEventListener('click', function() {
    isPaused = !isPaused;
    this.textContent = isPaused ? 'Resume' : 'Pause';  // Update button
    if (!isPaused) {
        requestAnimationFrame(updatePlot)
    }
});