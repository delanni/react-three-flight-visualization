# React + Three.js workshop using @react-three (prezi / bene:studio) 

This document contains some directions and context around the workshop material.

## Requirements
**Tools:**
 - `node.js` (https://nodejs.org) (12+, ideally 14+)
 - `yarn` (https://yarnpkg.com/ - or `npm install -g yarn`)
 - IDE of choice (VS code or IntelliJ Idea recommended)

**Knowledge:**
 - javascript (intermediate)
 - react (basic / intermediate)
   - hooks, function components, context
   - fibers
 - typescript (basic)
 - 3D (basic)
   - models
   - meshes
   - 3D vector maths

## Workshop purpose
Demonstrate building applications that use 3D rendering through a react-ish interface.
The end-product we're going to build is an app that visualizes some flight data (generated, but may as well fetch real data).

Disclaimer: We know that the universe is not geocentric, but for our purposes and visibility, this is easier to depict.

<insert final demo link>

## Steps to build a basic flight visualization app

### Step 0 - Preparations done by us
Create react app
Set up some tooling
Download & add models
Data generators
(Retain some secondary-to-workshop components, utilities, and constants)

Remember: if your code starts to look ugly: run `yarn prettify`

### Step 1 - @react-three Hello-world
Run `yarn`
Add dependencies to the libraries we'd be using:
 - @react-three/fiber - The bridge that manages the three <-> react interface
 - @react-three/drei - Some utilities that help working with the above
 - three (& @types/three) - The 3D library these are all built on
 - gltfjsx - A utility to help build JSX interface for GLTF models

Basically:
`yarn add @react-three/drei @react-three/fiber three`
`yarn add -D @types/three gltfjsx`

Now you can start the app:
`yarn start`

You'll see a white screen. Success!

In the `FlightVisualizationApp`, you can set up few a basic objects to see the app is actually working:
```typescript jsx
  // We can use some of the utilities we prepared.
  <Canvas>
    <ambientLight intensity={1.0} /> {/* <pointLight intensity={2.5} position={[2,2,2]} />  */}
    <OrbitControls/>
    <Box position={[0,0,0]} />
  </Canvas>
```

This is all right, we can now see and interact the world. You can play around with some of the parameters, to see how the world reacts.

One more thing to try out, is how we can refer to, or animate these objects.

Let's animate the intenstiy of the light with a setInterval + setState;
Let's animate the position of the light with `useFrame
(Introduce the concept of phases in animation, and talk about some 3D vector maths)

Poof! Hooks can only be used within the react-three context.
-> Let's create a scene - it's a good division between the magical 3d world and the react we know and love

Now we have a blinking strobe light flying around a box.

### Step 2 - Introduce external models
Talk about meshes + materials + models.
Mention sketchfab

Models downloaded an unzipped to `/public/models/`. 
It's because our webserver hosts these files, and they're accessible from the browser who'd like to load the models/materials based on urls.
More notes in: [this doc](/public/importing-a-new-model.md)

Generate model wrappers with `gltfjsx`:
```shell
cd src/
gltfjsx ../public/models/plane/plane.gltf -t -k -m
gltfjsx ../public/models/globe/globe.gltf -t -k -m
```

We can now include the JSX models to our scene, and we should see something work out, let's correct the files as we proceed:
 - urls
 - scaling
 - positioning
 - contents

Let's fix the light orbiting the globe.

Let's place the plane model as well, and try to fix its scale and orientation.
(Maybe demonstrate the configurator component)

### Step 3 - Let's fly around the globe
This section will contain some maths that we tried to keep to the minimum, not to disturb the flow of the workshop.

For the application code not to get too crowded, it is useful to introduce some layers of abstraction. 
I'd introcude one that separates the model of a plane from a flight that is supposed to fly between two cities:
 - The plane model bears the responsibility of drawing a plane straight, towards the -Z axis
 - The flight is representing one of these plane models in flight (taking care of movement)

Let's create a new file `Flight.tsx` close to the `FlightsScene.tsx`.

```typescript jsx
// We'll basically need this in a component:
const rotationBoxRef = useRef<Group>();
const flightContainerRef = useRef<Group>();
return (
<group ref={rotationBoxRef}>
  <group ref={flightContainerRef} position-y={GLOBE_BASE_RADIUS * GLOBE_SCALE + FLOAT_HEIGHT}>
    {/* ^ This box is a convenience because it's hard to forward ref to inside the airplane */}
    <Airplane scale={PLANE_SCALE} />
  </group>
</group>
)
```

After this, the flight should appear on top of the world, around the north pole.

If you're brave, you can try to use your own 3D maths, since there's a dozen ways of position/rotate the flight - I'll show you one, that's pretty convenient.

The rotation can be done with rotating the object over time:
```typescript jsx
  useFrame((state, delta) => {
    if (rotationBoxRef.current) {
      const angle = Math.PI * 2 / 4 * delta;
      rotationBoxRef.current.rotateOnAxis(LEFT, angle);
    }
  });
```

The small issue with this method, is that it's harder to calculate increments between steps to get to a correct end state.

Another method is called interpolation. Interpolation in general is taking the start and end states, and calculate steps in-between, using a phase indicator.
Let's try this for rotating our airplane:

```typescript jsx
  useFrame((state, delta) => {
    const startQuaternion = new Quaternion().setFromAxisAngle(LEFT, 0)
    const midQuaternion = new Quaternion().setFromAxisAngle(LEFT, Math.PI)
    const endQuaternion = new Quaternion().setFromAxisAngle(LEFT, Math.PI * 2)
    if (rotationBoxRef.current) {
      const phase = (state.clock.elapsedTime % 3) / 3;

      const rotationQuaternion = new Quaternion();
      if (phase < 0.5) { // because of rotation optimization
        rotationQuaternion.slerpQuaternions(startQuaternion, midQuaternion, phase * 2);
      } else {
        rotationQuaternion.slerpQuaternions(midQuaternion, endQuaternion, (phase - 0.5) * 2);
      }
      
      rotationBoxRef.current.setRotationFromQuaternion(rotationQuaternion);
    }
  });
```

We can abstract the sun similarly to an object in the scene that takes care of it's orbit, 
even add a visible model to show where the sun currently is.

### Step 4 - Budapest - Sydney!

Let's step up our game a notch. Let's include exact positions on the planet, and let's set up chartered flights between two points.
For example, between Budapest and Sydney.
It will require two things: associate our known geolocations with rotation quaternions, and moving the plane between these two.
Well - since we already know how to interpolate quaternions, we only need to figure out the first one! Let's get on it! 

Oh, maybe one more thing. Let's load some data! 
We can use the generator to generate some data:
```typescript jsx
yarn generate-data
```

Then we can load this data in `FlightsScene.tsx` with `useEffect` (pay attention to the dependencies, not to re-run it) - and find Sydney and Budapest.

Now - calculating the rotation quaternion from the cities are not that difficult, once you know you can multiply quaternions, you'll basically need to rotate the containing box of the aircraft with the right latitude and longitude amounts.
Lucky for you, you can save this work by using the `rotationQuaternionForCoordinates` function from the utilities we provide for you.

Pass the cities to the flights, and let's see if the flights appear on the map:
```typescript jsx
// Pass the filtered city data to the flights:
  <Flight city={budapest!} />
  <Flight city={sydney!} />
  
// And in the flight:
if (rotationBoxRef.current){
  const q = rotationQuaternionForCoordinates(city.latitude, city.longitude);
  rotationBoxRef.current?.setRotationFromQuaternion(q);
}

```

It's this easy, you ask? 
Well, sort of... (long detailed part about world coordinates and how orienting the flight might not be that easy);

Now, we can try to move the flights between the two cities:

```typescript jsx
  useFrame((state, delta) => {
    const startQuaternion = rotationQuaternionForCoordinates(from.latitude, from.longitude);
    const endQuaternion = rotationQuaternionForCoordinates(to.latitude, to.longitude);


    if (rotationBoxRef.current && flightContainerRef.current) {
      const flightTime = 4;
      const phase = (state.clock.elapsedTime % flightTime) / flightTime;
      const worldPositionBefore = flightContainerRef.current.getWorldPosition(new Vector3());

      const rotationQuaternion = new Quaternion();
      rotationQuaternion.slerpQuaternions(startQuaternion, endQuaternion, phase);
      rotationBoxRef.current.setRotationFromQuaternion(rotationQuaternion);

      flightContainerRef.current.lookAt(worldPositionBefore);
      flightContainerRef.current.rotation.z = 0;
    }
  });
```


### Step 5 - Let there be (f)light(s)!

In this step, we'll make use of the generated flight data, and visualize a LOT of flights at the same time, now that we know how to!

Let's load both data sources, and extract the interesting bits of them:
```typescript jsx
  useEffect(() => {
  fetch('/data/airports.json', {})
    .then((airportsResponse) => airportsResponse.json())
    .then((airportsJson: IAirport[]) => {
      const airportsMap = indexBy(e=>e.id, airportsJson);

      setAirportsMap(airportsMap);
      setAirportList(airportsJson);
    });
}, []);

useEffect(() => {
  fetch('/data/flights.json', {})
    .then((flightsResponse) => flightsResponse.json())
    .then((flightsJson) => flightsJson.map(parseFlightDates))
    .then((flightsJson: IFlight[]) => setFlightsList(flightsJson));
}, []);
```

Let's limit the number of flights rendered, and use a react-like array expansion to show all the flights:
```typescript jsx
  const renderedFlights = flightsList.slice(0, 10);

  return (
    <>
      <OrbitControls />
      <Sun />
      <Globe />
      {renderedFlights.map((flight) => {
        const from = airportsMap[flight.departureAirportId];
        const to = airportsMap[flight.arrivalAirportId];
        return <Flight key={flight.id} from={from} to={to} />;
      })}
    </>
  )
```

And there you have it! You now have a bunch of chartered flights going from cities to other cities!

### Step 6 - Cities

A quite easy task now, with all our knowledge to visualize all the cities for the airports we have.
Let's create an object in our `flightsScene` -> `Airport.tsx`

```typescript jsx
// This function component should only take an IAirport object and render it on the map
// Using the same bounding box rotation method, we can draw a simple square/box to any geo-location easily
    <group ref={rotationBoxRef} quaternion={rotationQuaternion}>
      <Box
        size={[0.05, 0.05, 0.05]}
        color={'hotpink'}
        position={[0, EARTH_SURFACE_ELEVATION, 0]}
      />
    </group>
```

On this simple addition, we can demonstrate how simple mouse-interaction is to set up.
If you create a piece of state to hold the hover-state, then we can conditionally change the color of the box:

```typescript jsx
    const [hover, setHover] = useState(false)
    const rotationQuaternion = rotationQuaternionForCoordinates(props.airport.latitude, props.airport.longitude);
// ...
   return (
    <group ref={rotationBoxRef} quaternion={rotationQuaternion}>
      <Box
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        size={[0.05, 0.05, 0.05]}
        color={hover ? 'hotpink' : 'red'}
        position={[0, EARTH_SURFACE_ELEVATION, 0]}
      />
    </group>
   )
```

And while we're at it, let's showcase HTML on the canvas too!
Three.js can project the world's coordinates on the screen for us, and move HTML dom elements on top of the canvas floating on their screen position.
Let's add an info label right next to our simple box that shows some info about the airport when hovered:

```typescript jsx
  {hover ? (
    <Html position-y={EARTH_SURFACE_ELEVATION}>
      <div className="info-bubble">
        <div>[{props.airport.city}]</div>
        <div>{props.airport.id}</div>
        <div>
          ({props.airport.latitude};{props.airport.longitude})
        </div>
        <a href={`https://en.wikipedia.org/wiki/${props.airport.city}`}>wikipedia</a>
      </div>
    </Html>
  ) : null}
```

Lastly, if you want to make it a bit more interesting, add a light to the city to show where they are:
```typescript jsx
      <Sphere
        position={LIGHT_POSITION}
        baseColor={hover ? 'limegreen' : 'red'}
      />
      <pointLight
        ref={lightRef}
        color={hover ? 'limegreen' : 'red'}
        position={LIGHT_POSITION}
      />
```

and you can drive this with some animation:
```typescript jsx
  useFrame((state, delta) => {
  if(lightRef.current) {
    const blinkPeriod = 3;
    const phase = (state.clock.elapsedTime % blinkPeriod)/blinkPeriod;
    lightRef.current.intensity = Math.sin(phase * Math.PI *2) * 0.5 + 0.5;
  }
});
```
