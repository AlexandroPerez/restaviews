/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          sizes: [{
            /*
            Original images are 800x600 at the time of this writting, so the largest are
            kept at that size. If larger images are introduced later, you should change these
            sizes. */

            width: 800,
            name: 'large',
            quality: 50

          },{
            width: 400,
            name: 'medium',
            quality: 40
          }, {
            width: 280,
            name: 'small',
            quality: 30
          }]
        },

        /*
        You don't need to change this part if you don't change
        the directory structure.
        */
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'src/images/',
          dest: 'dist/img/'
        }]
      }
    },

    /* Clear out the img directory if it exists */
    clean: {
      dev: {
        src: ['dist/img'],
      },
    },

    /* Generate the img directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['dist/img']
        },
      },
    },

    /* Copy icon images that don't go through processing into the dist/img/icons folder */
    copy: {
      dev: {
        files: [{
          expand: true,
          cwd: 'src/images/icons',
          src: '**',
          dest: 'dist/img/icons'
        }]
      },
    },
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);

};
