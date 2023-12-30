<p align="center">
  <a href="https://rendrjs.com">
    <img src="https://rendrjs.com/r-512.png" width="318px" alt="Rendrjs logo" style="width: 200px;" />
  </a>
</p>

<h1 align="center">Rendrjs</h1>

<p align="center">Rendrjs is a framework for building web user interfaces.</p>



* **Declarative:** Create interactive UIs with simple, declarative code. Define what your component should look like, and when the state changes, Rendrjs will update the DOM for you.
* **Component-based:** Build complex UIs with simple, reusable components that manage their own state.
* **Easy:** Rendrjs UIs are written in pure JavaScript / TypeScript. No need to learn JSX or template directives, and no need for build plugins.
* **Light-weight:** Rendrjs bundles are up to 3x smaller than Svelte bundles and 25x smaller than React bundles.
* **Efficient:** Rendrjs is fast and leaves a small memory footprint.

[See the benchmarks](https://krausest.github.io/js-framework-benchmark/2023/table_chrome_120.0.6099.62.html)


## Getting Started
Create a new app from the typescript template:
```bash
npx degit github:rendr-js/templates/typescript my-app
cd my-app
npm i
npm start
```

## Basic Usage
```javascript
import {
  mount,
  text,
  component,
  element,
  useState,
} from '@rendrjs/core';

const App = () => {
  const [count, setCount] = useState(0);

  return element('button', {
    slot: text(`Count: ${count}`),
    onclick: () => setCount(c => c + 1),
  });
};

mount(document.querySelector('#root')!, component(App));
```

## Contributing
Make a pull request.
