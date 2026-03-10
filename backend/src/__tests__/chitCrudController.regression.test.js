'use strict';

const { createChitFund, listUserChits } = require('../controllers/chitCrudController');

describe('chitCrudController — unauthenticated regression', () => {
  function buildRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
  }

  it('createChitFund returns 401 error envelope for unauthenticated', async () => {
    const req = { body: {}, user: undefined };
    const res = buildRes();
    await createChitFund(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.any(String) }));
  });

  it('listUserChits returns 401 error envelope for unauthenticated', async () => {
    const req = { user: undefined };
    const res = buildRes();
    await listUserChits(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.any(String) }));
  });
});
