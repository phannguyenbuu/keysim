# KeySim

https://keyboardsimulator.xyz/

design and test virtual 3d keyboards.

## repo layout

- `frontend/` React (CRA) app
- `backend/` Flask API + admin templates

## deploy (manual)

scp -r backend root@31.97.76.62:keysim
scp -r frontend/build/* root@31.97.76.62:/var/www/keysim

## getting started

```
cd frontend
nvm use
npm install
npm start
```

## backend (optional)

```
cd backend
python app.py
```

## contributing

**colorways:** Any PR's for new colorways will be accepted as long as there is a real physical version of that colorway, or an ongoing group buy.

**layouts:** The goal of this project is not to recreate every possible keyboard layout, therefore I have no plans to add any new layouts myself. However PR's for new layouts will be accepted as long as they are not too similar to current layouts.

## adding new colorways

run the command `npm run create-colorway COLORWAY_ID "COLORWAY_NAME"` from `frontend/` to create the file: `/frontend/src/config/colorways/colorway_COLORWAY_ID`. Edit this file directly or paste json from the advanced section of the editor tab.

## A note on three.js version

This project targets `three` ^0.178 and uses BufferGeometry APIs throughout. Avoid deprecated `*BufferGeometry` class names in new code.

## configuration

json configuration for layouts and keymaps are based on [qmk](https://beta.docs.qmk.fm/). keymaps can be changed by switching the corresponding [keycodes](https://beta.docs.qmk.fm/using-qmk/simple-keycodes/keycodes).

_NOTE: Special keys from keyboards with custom firmware (e.g. [layer switching](https://beta.docs.qmk.fm/using-qmk/software-features/feature_layers)) may not trigger keydown events, as these are not [supported](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) in javascript_

## screenshots

![alt example image](./frontend/public/example-1.jpg?raw=true)

![alt example image](./frontend/public/example-2.jpg?raw=true)

![alt example image](./frontend/public/example-3.jpg?raw=true)
