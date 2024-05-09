import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import scipy
from typing import Tuple
from tqdm import trange

# Physical parameters

b = 4 # Ns/m
L = .25 # m
c = 200 # m/s

# Simulation parameters

n = 200
delta_x = L/n # m (spacial resolution)
delta_t = delta_x / (c * np.sqrt(2)) # minimum delta_t for numerical stability
f = 1/delta_t
print('Sampling frequency is', f, 'hz')

# --- Initial state ---

def pluck(l: float, delta_y: float) -> np.ndarray:
    '''Get y with an initial state, plucking the string at length l with displacement delta_y'''
    y = np.zeros(n)
    n_displaced = int(n*(l/L))
    for i in range(1, n_displaced):
        y[i] = i/n_displaced * delta_y
    
    for i in range(n_displaced, n-1):
        y[i] = (1-(i-n_displaced+1)/(n-n_displaced)) * delta_y

    return y

def gaussian_smooth(arr: np.ndarray, sigma: float) -> np.ndarray:
    '''Smooths a 1D NumPy array using a Gaussian kernel.'''
    kernel = np.exp(-((np.arange(len(arr)) - len(arr) // 2) ** 2) / (2 * sigma ** 2))
    kernel /= np.sum(kernel)
    smoothed_arr = np.convolve(arr, kernel, mode='same')
    return smoothed_arr

# --- derivation ---

def partial_x2(y: np.ndarray) -> np.ndarray:
    '''Second spatial derivative using central differences'''
    d2y_dx2 = (np.roll(y, -1) - 2 * y + np.roll(y, 1)) / delta_x**2
    d2y_dx2[0] = 0  # Dirichlet boundary conditions
    d2y_dx2[-1] = 0
    return d2y_dx2

# --- simulation ---

def timestep(y: np.ndarray, v: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    '''Performs one time step of the wave equation'''
    d2y_dx2 = partial_x2(y)
    d2y_dt2 = c**2 * d2y_dx2 - b * v
    v += d2y_dt2 * delta_t
    y += v       * delta_t
    return y, v

# --- recording

def normalize(a: np.ndarray) -> np.ndarray:
        a -= np.min(a)
        a /= np.max(a)
        return (a - .5) * 2

def perform_recording(y, length: float, microphone_pos: float, filename: str) -> None:
    v = np.zeros(n)
    n_recording = int(length / delta_t)
    microphone = np.zeros(n_recording)

    for i in trange(n_recording):
        y, v = timestep(y, v)
        microphone[i] = (y[int(n * microphone_pos/L)])

    audio = normalize(microphone)
    scipy.io.wavfile.write(filename=filename, rate=int(f), data=audio)

# --- visualization ---

def visualize(y):
    x = np.linspace(0, L, n)
    v = np.zeros(n)

    fig, ax = plt.subplots()
    line, = ax.plot(x, y)
    ax.set_ylim(-max(y), max(y))  # Set the y-axis limits to fit the initial condition

    def animate(i):
        global y
        global v
        y, v = timestep(y, v)
        line.set_ydata(y)
        return line,

    ani = animation.FuncAnimation(fig, animate, frames=10, interval=1, blit=True)
    plt.show()

if __name__ == '__main__':
    y_0 = pluck(0.1, 0.007)
    visualize(y_0)