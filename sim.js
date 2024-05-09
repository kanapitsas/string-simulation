// Constants and initial conditions
let b = 4; // Ns/m
const L = 0.25; // m

let c = 200; // m/s
let n = 100;

let delta_x = L / (n-1);
let delta_t = delta_x / (c * Math.sqrt(2)); // stability condition
let f = 1 / delta_t;
let timesteps_per_frame = 1

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

    // Enforce boundary conditions explicitly
    y[0] = 0;
    y[n - 1] = 0;

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
        title: 'x (m)',
        range: [0, L]  // Set the range of the x-axis from 0 to L (length of the string)
    },
    yaxis: {
        title: 'y (m)',
        range: [-0.01, 0.01]  // Set the range of the y-axis from -0.01 to 0.01 meters
    },
    showlegend: false
};
Plotly.newPlot(plotDiv, [trace], layout);

// Update the plot in real-time
let lastFrameTime = Date.now();
let frameCount = 0;
let fpsInterval = 1000; // time in ms to update the FPS counter
let lastFpsUpdate = Date.now();

function updatePlot() {
    if (!isPaused) {
        const now = Date.now();
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;

        // Calculate FPS every second to reduce flickering in the display
        if (now - lastFpsUpdate > fpsInterval) {
            const fps = frameCount * 1000 / (now - lastFpsUpdate);
            document.getElementById('fps-display').textContent = `FPS: ${fps.toFixed(2)}`;
            document.getElementById('sim-speed-display').textContent = `${(timesteps_per_frame * fps / f).toFixed(5)}x`;
            lastFpsUpdate = now;
            frameCount = 0;
        }
        
        frameCount++;
        for (let i = 0; i < timesteps_per_frame; i++) {
            [y, v] = timestep(y, v);
        }
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
        requestAnimationFrame(updatePlot);  // Continue the animation loop regardless of pause state
    }
}

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

function updateTimestepsPerFrame(newTimestepsPerFrame) {
    timesteps_per_frame = newTimestepsPerFrame;
}

function updateB(newB) {
    b = newB;
}

function updateC(newC) {
    c = newC;
    delta_t = delta_x / (c * Math.sqrt(2));
}


function updateN(newN) {
    const oldY = y.slice();  // Copy the current y array
    const oldV = v.slice();  // Copy the current v array

    n = newN;  // Update n with the new value
    delta_x = L / (n-1);
    delta_t = delta_x / (c * Math.sqrt(2));
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

// Event listeners

document.getElementById('n-slider').addEventListener('input', function() {
    document.getElementById('n-value').textContent = this.value;
    updateN(parseInt(this.value));
});

document.getElementById('b-slider').addEventListener('input', function() {
    document.getElementById('b-value').textContent = this.value;
    updateB(parseInt(this.value));
});

document.getElementById('c-slider').addEventListener('input', function() {
    document.getElementById('c-value').textContent = this.value;
    updateC(parseInt(this.value));
});

document.getElementById('sim-speed-slider').addEventListener('input', function() {
    document.getElementById('sim-speed-value').textContent = this.value;
    updateTimestepsPerFrame(parseInt(this.value));
});


document.getElementById('pause-btn').addEventListener('click', function() {
    isPaused = !isPaused;
    this.textContent = isPaused ? 'Resume' : 'Pause';  // Update button
    if (!isPaused) {
        requestAnimationFrame(updatePlot)
    }
});

// Drawing

let isDrawing = false;

function toggleDrawing() {
    isDrawing = !isDrawing;
    document.getElementById('mode-display').textContent = isDrawing ? 'DRAW' : 'VIEW';
    if (isDrawing) {
        isPaused = true;
    }
}

// Function to find nearest index based on mouse X position
function findNearestIndex(mouseX) {
    const plotRect = plotDiv.getBoundingClientRect();
    const xScaled = (mouseX - plotRect.left) * (L / plotRect.width);
    return Math.round(xScaled / delta_x);
}

plotDiv.addEventListener('mousedown', function(event) {
    toggleDrawing();
});

plotDiv.addEventListener('mousemove', function(event) {
    if (isDrawing) {
        const index = findNearestIndex(event.clientX);
        y[index] = -(((event.clientY - plotDiv.getBoundingClientRect().top) / plotDiv.clientHeight) * 0.034 - 0.018); // Invert and scale Y based on plot height
        Plotly.redraw(plotDiv);
    }
});