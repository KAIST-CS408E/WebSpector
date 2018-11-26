import sys
import time
from flask import Flask, render_template, request
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html.j2', search='http://www.example.com/')

@app.route('/search', methods=['GET'])
def search():
    url = str()
    if 'key' in request.args:
        url = request.args.get('key')
    return render_template('search.html.j2', url=url, score=20)

@app.route('/api/result', methods=["GET"])
def result():
    time.sleep(1)
    url = str()
    if 'url' in request.args:
        url = request.args.get('url')
    return '{"url": "' + url + '"}'

if __name__ == '__main__':
    port = 4000
    debug = False

    if len(sys.argv) > 1:
        if 'debug' in sys.argv[1:]:
            debug = True

    app.run(host='0.0.0.0', port=port, debug=debug)
