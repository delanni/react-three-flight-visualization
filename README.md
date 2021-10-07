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

<insert final demo link>

## Steps to build a basic flight visualization app

### Step 0 - Preparations done by us
Create react app
Set up some tooling
Download & add models
Data generators
(Retain some secondary-to-workshop components, utilities, and constants)

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
