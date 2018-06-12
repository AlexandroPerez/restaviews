# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1 [DONE]

For the **Restaurant Reviews** project, I incrementally converted a static webpage to a mobile-ready web application. In **Stage One**, I took a static design that lacked accessibility and converted the design to be responsive on different sized displays and accessible for screen reader use. I also added a service worker to begin the process of creating a seamless offline experience for users.

### Specification

I was provided the code for a restaurant reviews website. The code had a lot of issues. It’s barely usable on a desktop browser, much less a mobile device. It also doesn’t include any standard accessibility features, and it doesn’t work offline at all. My job was to update the code to resolve these issues while still maintaining the included functionality. 

# How to Run in your local environment
1. Clone the repo.
2. Make sure [node.js is installed](https://nodejs.org/en/)
3. You can use `yarn install` like me, or simply `npm install`
4. Run in localhost using `python -m SimpleHTTPServer`, `python3 -m http.server` if using python 3. For ease, you could use [nmp package live-server](https://www.npmjs.com/package/live-server), which you can install globallly, then run `live-server`.
###### Gruntfile.js
If you want to run the Gruntfile.js you'll also need to install [GraphicsMagick](http://www.graphicsmagick.org/) (recommended), or if you prefer, use ImageMagick, but in that case you'll be on your own since I haven't tested it. Please note that if you end up picking ImageMagick you may also need to change some settings in the Gruntfile.
