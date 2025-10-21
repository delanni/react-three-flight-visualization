import './App.css';

import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import FlightsScene from './flightsScene/FlightsScene';
import { Dictionary, IAirport, IFlight } from './types';
import { indexBy } from 'ramda';
import { prettyDate } from './Utilities';
import { FlightFilterControls } from './components/FilterControls';
import { SimulationSizeControl, SimulationSpeedControl } from './components/SimulationControls';
import { airports } from './airportsData';
import { generateFlightsAtRuntime } from './flightGenerator';

const date = Date.now();

function FlightVisualizationApp() {
  const [flightsList, setFlightsList] = useState<IFlight[]>([]);
  const [airportsMap, setAirportsMap] = useState<Dictionary<IAirport>>({});
  const [airportsList, setAirportList] = useState<IAirport[]>([]);

  useEffect(() => {
    // Use static airport data
    const airportsMap = indexBy((e) => e.id, airports);
    setAirportsMap(airportsMap);
    setAirportList(airports);

    // Generate ~200 flights at runtime with departure times relative to page load
    const generatedFlights = generateFlightsAtRuntime(airports, 200, Date.now());
    setFlightsList(generatedFlights);
  }, []);

  const [selectedFlight, setSelectedFlight] = useState<IFlight | null>(null);
  const [filteredFlights, setFilteredFlights] = useState<IFlight[]>([]);
  const [maxFlightCount, setMaxFlightCount] = useState(20);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationTime, setSimulationTime] = useState(date);

  return (
    <div className="App">
      <aside className="controlPanel">
        <div className="input-controls">
          <div>Current date: {prettyDate(new Date(simulationTime))}</div>
          <SimulationSizeControl onMaxFlightCountChange={setMaxFlightCount} />
          <SimulationSpeedControl onSimulationSpeedChange={setSimulationSpeed} />
        </div>
        <hr />
        <FlightFilterControls
          flights={flightsList}
          airports={airportsList}
          airportMap={airportsMap}
          maxFlightCount={maxFlightCount}
          simulationTime={simulationTime}
          selectedFlight={selectedFlight}
          setSelectedFlight={setSelectedFlight}
          onFilteringChanged={setFilteredFlights}
        />
      </aside>
      <React.Suspense fallback={<div>Loading data...ð</div>}>
        <Canvas id="canvas">
          <FlightsScene
            flightsList={filteredFlights}
            airportsList={airportsList}
            airportsMap={airportsMap}
            selectedFlight={selectedFlight}
            setSelectedFlight={setSelectedFlight}
            simulationSpeed={simulationSpeed}
            onSimulationMinuteTick={setSimulationTime}
          />
        </Canvas>
      </React.Suspense>
    </div>
  );
}

export default FlightVisualizationApp;
