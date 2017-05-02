
export default function(timeout, processObj, cb) {
  let isDone = false,
      timeoutId;

  function pongHandler(payload) {
    if (payload && payload.workerEvent === 'pong') {
      isDone = true;
      clearTimeout(timeoutId);
      processObj.removeListener('message', pongHandler);
      cb(null, 'open');
    }
  }

  processObj.on('message', pongHandler);

  tryCommunication();

  function tryCommunication(shotCount = 1) {
    if (isDone) {
      return;
    }

    processObj.send({
      workerEvent: 'ping'
    }, undefined, (err) => {
      if (isDone) {
        return;
      }

      if (shotCount <= 200) {
        return;
      }

      if (err) {
        isDone = true;
        clearTimeout(timeoutId);
        cb(new Error('ipc message could not be sent to electron process'));
      }
    });

    timeoutId = setTimeout(() => {
      if (isDone) {
        return;
      }

      if (shotCount > 200) {
        isDone = true;
        return cb(new Error(`Worker timeout (${timeout} ms) ocurred waiting for ipc connection to be available`));
      }

      tryCommunication(shotCount + 1);
    }, timeout);
  }
}
