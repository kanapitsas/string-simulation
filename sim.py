import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import scipy
from tqdm import trange

# Physical constants

b = 4 # Ns/m
L = 0.426 # m
c = 120 # m/s

# Simulation parameters

n = 400
delta_x = L/n # m (spacial resolution)
delta_t = delta_x / (c * np.sqrt(2))
f = 1/delta_t
print('Sampling frequency is', f, 'hz')

def pluck(l: float, delta_y: float):
    '''Get y with an initial state, plucking the string at length l with displacement delta_y'''
    y = np.zeros(n)
    n_displaced = int(n*(l/L))
    for i in range(1, n_displaced):
        y[i] = i/n_displaced * delta_y
    
    for i in range(n_displaced, n-1):
        y[i] = (1-(i-n_displaced+1)/(n-n_displaced)) * delta_y

    return y

def gaussian_smooth(arr, sigma):
    """
    Smooths a 1D NumPy array using a Gaussian kernel.

    Parameters:
        arr (numpy array): Input array to be smoothed.
        sigma (float): Standard deviation of the Gaussian kernel.

    Returns:
        smoothed_arr (numpy array): Smoothed array with the same length as the original.
    """
    kernel = np.exp(-((np.arange(len(arr)) - len(arr) // 2) ** 2) / (2 * sigma ** 2))
    kernel /= np.sum(kernel)
    smoothed_arr = np.convolve(arr, kernel, mode='same')
    return smoothed_arr

def partial_x2(y):
    """ Second spatial derivative using central differences """
    d2y_dx2 = (np.roll(y, -1) - 2 * y + np.roll(y, 1)) / delta_x**2
    d2y_dx2[0] = 0  # Dirichlet boundary conditions
    d2y_dx2[-1] = 0
    return d2y_dx2

def timestep(y, v):
    '''Performs one timestep of the wave equation with damping'''
    d2y_dx2 = partial_x2(y)
    d2y_dt2 = c**2 * d2y_dx2 - b * v
    v += d2y_dt2 * delta_t
    y += v       * delta_t
    return y, v

x = np.linspace(0, L, n)
y = pluck(0.1, 0.007)
y = gaussian_smooth(y, 1) # not sure if that changes anything
v = np.zeros(n)

recording_length = 1 # s
n_recording = int(recording_length / delta_t)
microphone = np.zeros(n_recording)
for i in trange(n_recording):
    y, v = timestep(y, v)
    microphone[i] = (y[n//10])

# Normalization
def normalize(a):
    a -= np.min(a)
    a /= np.max(a)
    return (a - .5) * 2

audio = normalize(microphone)

scipy.io.wavfile.write(filename='microphone.wav', rate=int(f), data=audio)


if False:
    x = np.linspace(0, L, n)
    y = pluck(0.05, 0.007)
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