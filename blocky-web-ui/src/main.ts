import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppModule } from './app/app.modules';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
//bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
