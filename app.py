from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import socketio as soc
import logging
from pythonAI.agent import process_data

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['SECRET_KEY'] = 'secret!'
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
sio = soc.Client()


@app.route('/')
def index():
    return render_template("index.html")


@socketio.on_error_default
def error_handler(e):
    logger.error(f'An error has occurred: {e}')


@socketio.on('game_update')
def handle_game_update(data):
    process_data(data)


if __name__ == '__main__':
    sio.connect('http://localhost:5001')
    socketio.run(app, use_reloader=False, log_output=True)
