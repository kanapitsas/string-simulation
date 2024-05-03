import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation

# Constants
alpha = 0.3  # mm^2/s, diffusion coefficient
L = 100  # mm, length of the domain
n = 1000  # number of spatial points
delta_x = L / n  # mm, spatial resolution

# Stability condition for the time step
delta_t = (delta_x**2) / (4 * alpha)  # time step (adjusted for stability)

# Define the grid of x points
x = np.linspace(0, L, n)
# Initial condition
y = np.sin(10*x) + 1
y = y / max(y) * 50

def partial_x2(y):
    """ Second spatial derivative using central differences """
    d2y_dx2 = (np.roll(y, -1) - 2 * y + np.roll(y, 1)) / delta_x**2
    d2y_dx2[0] = 0  # Dirichlet boundary conditions
    d2y_dx2[-1] = 0
    return d2y_dx2

def timestep(y):
    """ Perform a single time step in the simulation """
    dy_dt = alpha * partial_x2(y)
    y += dy_dt * delta_t
    y[0] = 0  # Enforcing boundary conditions
    y[-1] = 0
    return y

fig, ax = plt.subplots()
line, = ax.plot(x, y)
ax.set_ylim(0, max(y))  # Set the y-axis limits to fit the initial condition

def animate(i):
    global y
    y = timestep(y)
    line.set_ydata(y)
    return line,

ani = animation.FuncAnimation(fig, animate, frames=int(10/delta_t), interval=20, blit=True)
plt.show()
