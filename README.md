# Live MTA Train Locations

A Next.js application that displays live MTA train locations on an interactive map using GTFS real-time data.

## Features

- Real-time MTA train location tracking
- Interactive map using Leaflet.js
- Server-side data fetching and processing
- Responsive design with Tailwind CSS
- TypeScript for type safety

## Prerequisites

- Node.js 18.x or later
- npm or yarn

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd livetrain
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/`
  - `pages/`: Next.js page components
  - `components/`: Reusable React components
  - `lib/`: Utility functions and external library configurations
  - `services/`: Data fetching and processing logic
  - `types/`: TypeScript type definitions
  - `styles/`: Global and component-specific styles
- `public/`: Static assets

## API Integration

The application uses the MTA's GTFS real-time API to fetch train location data. The data is fetched every 15 seconds and processed server-side. The application supports multiple subway lines which can be configured in the `.cursorrules` file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
