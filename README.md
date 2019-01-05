#contributors
Lotte Bijl - Online Department
Brian Roos - Online Department


#Download/Install Apps#
Tower (for cloning repository) 
Atom (code editor)
AMPPS (for PHP, MySQL)


#Download/Install packages#

__Download Node.js__
http://nodejs.org

__Download gulp__
$ sudo npm install -g gulp

#To do#

- Clone repository
- Open in Atom and run build

- Open in terminal
$ cd /rootfolder/of/gulpfile

- Install node modules
$ npm install 

When getting an Error 'Cannot find module '{name-node-module}', make sure you install it properly with command
$ npm install name-node-module --save-dev

- Run build
$ gulp

- Run watch
 $ gulp watch


#Handlebars#
Handlebars is being used for building templates (/views/.handlebars), elements (views/elements/.handlebars) and modules (views/modules/.handlebars)

When index.php does not show the pageindex check if you have app/compiler.php in dist and the vendor folder in root folder
