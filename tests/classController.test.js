const classController = require('../controllers/classController');

jest.mock('../models/Class', () => {
  const Fn = jest.fn(function (obj) {
    Object.assign(this, obj);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Fn.find = jest.fn();
  Fn.findById = jest.fn();
  Fn.findByIdAndUpdate = jest.fn();
  Fn.findByIdAndDelete = jest.fn();
  return Fn;
});

const Class = require('../models/Class');

describe('Class Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {}, user: { _id: 'user1' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  test('createClass - saves and returns 201', async () => {
    req.body = { title: 'Math' };
    await classController.createClass(req, res);
    expect(Class).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  test('getAllClasses - returns classes', async () => {
    const fake = [{ title: 'A' }];
    Class.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(fake) });
    await classController.getAllClasses(req, res);
    expect(Class.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fake);
  });

  test('bookClass - success adds student', async () => {
    const classObj = { students: [], maxStudents: 2, save: jest.fn().mockResolvedValue(true) };
    Class.findById.mockResolvedValue(classObj);
    req.params.classId = 'c1';
    await classController.bookClass(req, res);
    expect(Class.findById).toHaveBeenCalledWith('c1');
    expect(classObj.students).toContain(req.user._id);
    expect(res.json).toHaveBeenCalledWith(classObj);
  });

  test('bookClass - returns 400 when full', async () => {
    const classObj = { students: ['a', 'b'], maxStudents: 2, save: jest.fn() };
    Class.findById.mockResolvedValue(classObj);
    req.params.classId = 'c2';
    await classController.bookClass(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Class full' });
  });

  test('updateClass - updates and returns updated', async () => {
    const updated = { title: 'Updated' };
    req.params.id = 'cid';
    req.body = { title: 'Updated' };
    Class.findByIdAndUpdate.mockResolvedValue(updated);
    await classController.updateClass(req, res);
    expect(Class.findByIdAndUpdate).toHaveBeenCalledWith('cid', req.body, { new: true });
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('deleteClass - deletes and returns 204', async () => {
    req.params.id = 'delid';
    Class.findByIdAndDelete.mockResolvedValue();
    await classController.deleteClass(req, res);
    expect(Class.findByIdAndDelete).toHaveBeenCalledWith('delid');
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
