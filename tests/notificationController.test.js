jest.mock('../utils/email', () => ({
  sendEmail: jest.fn(),
  sendBulkEmail: jest.fn(),
  sendExpiryEmail: jest.fn()
}));

jest.mock('../utils/sse', () => ({
  send: jest.fn(),
  addClient: jest.fn(),
  removeClient: jest.fn()
}));

jest.mock('../models/Notification', () => {
  const Fn = jest.fn(function (obj) {
    Object.assign(this, obj);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Fn.insertMany = jest.fn();
  Fn.find = jest.fn();
  Fn.findByIdAndUpdate = jest.fn();
  Fn.findByIdAndDelete = jest.fn();
  Fn.countDocuments = jest.fn();
  return Fn;
});

const notificationController = require('../controllers/notificationController');
const Notification = require('../models/Notification');
const email = require('../utils/email');
const sse = require('../utils/sse');

describe('Notification Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('sendNotification - creates notification and sends email/sse', async () => {
    req.body = { recipientId: 'r1', message: 'Hi' };
    email.sendEmail.mockResolvedValue();
    await notificationController.sendNotification(req, res);
    expect(email.sendEmail).toHaveBeenCalledWith('r1', 'Hi');
    expect(Notification).toHaveBeenCalled();
    expect(sse.send).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('sendBulkNotification - inserts many and streams to each', async () => {
    req.body = { recipientIds: ['a', 'b'], message: 'Bulk' };
    email.sendBulkEmail.mockResolvedValue();
    const notifs = [{ recipient: 'a' }, { recipient: 'b' }];
    Notification.insertMany.mockResolvedValue(notifs);
    await notificationController.sendBulkNotification(req, res);
    expect(email.sendBulkEmail).toHaveBeenCalledWith(['a', 'b'], 'Bulk');
    expect(Notification.insertMany).toHaveBeenCalled();
    expect(sse.send).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('getAnalytics - returns total and unread counts', async () => {
    req.params = { type: 'any', id: 'uid' };
    Notification.countDocuments.mockImplementation(({ recipient, read }) => {
      if (read === false) return Promise.resolve(2);
      return Promise.resolve(5);
    });
    await notificationController.getAnalytics(req, res);
    expect(Notification.countDocuments).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ total: 5, unread: 2 });
  });

  test('streamNotifications - sets headers and registers client, removes on close', () => {
    let closeCb;
    req = {
      params: { type: 'any', id: 'stream1' },
      on: jest.fn((event, cb) => { if (event === 'close') closeCb = cb; })
    };
    res = { setHeader: jest.fn() };
    notificationController.streamNotifications(req, res);
    expect(res.setHeader).toHaveBeenCalled();
    expect(sse.addClient).toHaveBeenCalledWith('stream1', res);
    // simulate close
    closeCb && closeCb();
    expect(sse.removeClient).toHaveBeenCalledWith('stream1', res);
  });
});
