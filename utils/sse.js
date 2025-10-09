const clients = new Map();

exports.addClient = (id, res) => {
  clients.set(id, res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
};

exports.send = (id, data) => {
  const client = clients.get(id);
  if (client) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
};

exports.removeClient = (id, res) => {
  clients.delete(id);
};