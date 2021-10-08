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

