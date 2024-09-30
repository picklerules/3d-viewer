# 3D File Viewer

This project is a 3D file viewer built with **Laravel**, **Vite**, and **React**, using **Three.js** for rendering 3D models. It supports multiple 3D file formats, including GLTF, OBJ, FBX, STL, PLY, and VRML, allowing users to load, view, and interact with 3D models directly in the browser.

This project was completed as part of my internship at GeniusXR.

## Features

- **Supports multiple 3D file formats**: GLTF, OBJ, FBX, STL, PLY, and VRML.
- **Dynamic 3D viewer**: Users can interact with the 3D models (zoom, rotate, pan).
- **Material and texture handling**: Automatically applies material colors and textures where applicable.
- **Mesh property calculations**: Calculates and displays mesh details like surface area, volume, number of vertices, and triangles.

## Technologies Used

- **Laravel**: Backend framework for handling the server-side logic.
- **Vite**: Build tool for modern front-end development.
- **React**: Frontend framework for building the user interface.
- **Three.js**: JavaScript library for creating and displaying animated 3D graphics in the browser.

## How to Run the Project

1. Clone the repository:
   ```bash
   git clone https://github.com/picklerules/3d-viewer.git
   ```

2. Navigate to the project directory:
   ```bash
   cd 3d-viewer
   ```

3. Install the Node.js dependencies:
   ```bash
   npm install
   ```

4. Install the PHP dependencies:
   ```bash
   composer install
   ```

5. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

6. Generate the application key:
   ```bash
   php artisan key:generate
   ```

7. Start the Vite development server:
   ```bash
   npm run dev
   ```

8. Start the Laravel development server:
   ```bash
   php artisan serve
   ```

9. Open your browser and go to `http://localhost:8000` to view the 3D viewer.
