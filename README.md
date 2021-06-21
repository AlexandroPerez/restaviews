## Update: This Project has been migrated to Sails v1

This Project was originally built using Sails `v0.12`, and Gulp `v3.9.1`. Now the project has been updated to work with Sails `v1.4.3` and Gulp `v4.0.2`. Other packages have been upgraded as well.

You can refer to this repo to see an example of how you can migrate your own project as well.

I will end remaking and improving this Project by using a JAM stack. Most likely React(J), Sails(A) and Gatsby(M). I will provide a link to new Project when I start working on it.


# Mobile Web Specialist Certification Course

---

#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1 [DONE]

For the **Restaurant Reviews** project, I incrementally converted a static webpage to a mobile-ready web application. In **Stage One**, I took a static design that lacked accessibility and converted the design to be responsive on different sized displays and accessible for screen reader use. I also added a service worker to begin the process of creating a seamless offline experience for users.

### Specification

I was provided the code for a restaurant reviews website. The code had a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. My job was to update the code to resolve these issues while still maintaining the included functionality.

## Project Overview: Stage 2 [DONE]

During this stage of the **Restaurant Reviews** project, instead of relying on a static json file, I fetched restaurant data from a local API server that responded with json data. The app had to keep working offline, so I used indexedDB to cache API responses from previously seen restaurants, so they were available offline in the next visit.

### Specification

I was provided the code for a the local API server, and had to transition the project to use it instead of a static json file. In the previous stage of the project this static file was cached alongside other resources, but now I had to cache each json response given by the local API server to indexedDB.

## Project Overview: Stage 3 [DONE]

For the last Stage of the **Restaurant Reviews** project, I implemented the ability for users to mark a restaurant as a favorite, and submit new reviews for a given restaurant. This functionality was available while the application was offline, since all data was stored locally to indexedDB while awaiting for connection. By using Background Sync, Service workers, App Cache and indexedDB I was able to create a **Restaurant Reviews** app that worked seamlessly both online and offline.

### Specification

Building from previous code, and with after being provided an improved version of the API code, that allowed new restaurant reviews to be added, and restaurants to be marked as favorites, I implemented two new features in the app: favorite restaurants, and new reviews. These features were available offline thanks to Background Sync and the Service worker.

# How to Run in your local environment

1. Install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (Node Version Manager), or just make sure you have a stable Node version installed. 
> Please note that this project was last tested using Node version `14.17`, and **nvm** will use the `.nvmrc` provided to use it as default. So if you don't use nvm, and run into any problems try using Node `14.17`.
2. This Project also relies on Gulp.js, so you'll need to install the `gulp-cli` if you don't have it on your system already:
`> npm install --global gulp-cli`
3. Clone the repo.
4. You can use `yarn install` like me, or if you prefer npm, delete `yarn.lock` and run `npm install`.
5. Run `gulp build` to have gulp build the `dist` folder.
6. Run `yarn start` or `npm start` to start both the static-server `localhost:8000` and sails-server `localhost:1337`.

**NOTE** Depending on your OS, you may need to wait serveral seconds for the `sails-server` to start. You'll know app is ready to serve content once you see the following output after running `yarn start` or `npm start`:

```
Starting up http-server, serving ./dist
Available on:
  http://192.168.56.1:8000
  http://192.168.50.1:8000
  http://127.0.0.1:8000
  http://192.168.0.107:8000
Hit CTRL-C to stop the server
info:
info:                .-..-.
info:
info:    Sails              <|    .-..-.
info:    v0.12.14            |\
info:                       /|.\
info:                      / || \
info:                    ,'  |'  \
info:                 .-'.-==|/_--'
info:                 `--'-------'
info:    __---___--___---___--___---___--___
info:  ____---___--___---___--___---___--___-__
info:
info: Server lifted in `/mnt/d/Workspace/udacity/restaviews`
info: To see your app, visit http://localhost:1337
info: To shut down Sails, press <CTRL> + C at any time.

debug: -------------------------------------------------------debug:...
debug: Environment : development
debug: Port        : 1337
debug: -------------------------------------------------------
```
