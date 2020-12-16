It is possible to install Bee on your local server. Below is the instruction.

## Install Virtualenv

Doc: https://virtualenvwrapper.readthedocs.io/en/latest/
```bash
pip install virtualenvwrapper
export WORKON_HOME=~/Envs
mkdir -p $WORKON_HOME
source /usr/local/bin/virtualenvwrapper.sh
```
(you can place the last line in your `.bashrc` file)

Make a virtual environment for Bee
```bash
mkvirtualenv bee
```

## Install Bee requirement - Django related

```bash
git clone https://github.com/WireCell/wire-cell-bee.git
cd wire-cell-bee
pip install -r requirements.txt
```

Create a `bee/bee.conf` file with the following content
```
[common]
SECRET_KEY = any-password-like-string
MEDIA_ROOT = /path/to/upload/dir/
```
Replace the content after "=" with your own configuration. Note that the MEDIA_ROOT directory must exist and should have a 'drwxrwxrwx' (777) permission to allow user upload (this is the directory to store all the user uploaded files)

Not that for local development, the MEDIA_ROOT is set to the `tmp/`directory under the base directory. And the `STATIC_ROOT` is set to the `../bee-static`

Make a data/db.sqlite3 file, then
```bash
python manage.py migrate
```

## Install Bee requirement - Javascript related

### Install node.js (and npm)

This depends on the OS. I suggest using  [nvm](https://github.com/nvm-sh/nvm), which is like virtualenv for nodejs version control.
```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash
nvm install node
```

### install [parcel.js](https://parceljs.org/) (for packaging ES6 code)
```bash
npm install -g parcel-bundler
```

### Build the ES6 code inside Bee
```bash
cd events/static/js/bee
parcel --no-hmr watch bee.js
```

## Testing Bee

```bash
python manage.py runserver 0.0.0.0:8000
```
The go to http://localhost:8000 , do you see the homepage?
Grab this file http://www.phy.bnl.gov/~chao/data/bee-upload-test.zip and drag to the upload zone. Do you see the event?


### Deploy to a server
To be added.


