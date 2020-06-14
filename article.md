# Angular Fire and Forget Polling

In this tutorial I would like to show you how can you poll a service using Observables (RxJS) and the NgRx Store and Effects. It assumes that you have a basic knowledge of Angular, Typescript, NgRx and RxJS.

The goal here is to setup a fire and forget polling that will start once the first action is called and never stop.

## Initial setup

For the initial setup add the following packages:

- NgRx Store: `ng add @ngrx/store --minimal false`
- NgRx Effects: `ng add @ngrx/effects`
- NgRx DevTools:  `ng add @ngrx/store-devtools`
- Angular Material: `ng add @angular/material`

